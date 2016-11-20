const path = require('path');
const phantom = require('phantom');
const cheerio = require('cheerio');
const PagerStorage = require('./pager-storage');

class Pager {
	constructor(recipe, storage){
		this.recipe = recipe;
		this.storage = storage || new PagerStorage();
		this.cookies = [];
		this.phantom = null;

		this.runCount = 0;
		this.taskQueue = [];

		pushListRecipe.call(this);
	}

	getRecipe(){
		return this.recipe;
	}

	getRunCount(){
		return this.runCount;
	}

	getTaskCount(){
		return this.taskQueue.length;
	}

	// storage
	fetchAll(offset, limit){
		return this.storage.fetchAll(offset, limit);
	}

	fetch(id){
		return this.storage.fetch(id);
	}

	// run a task from queue
	run(){
		let recipe = this.taskQueue.shift();
		if (!recipe) return Promise.resolve();

		return runRecipe.call(this, recipe);
	}

	// run whole tasks from queue sequentially
	runAll(callback){
		let recipe = this.taskQueue.shift();
		if (!recipe) return Promise.resolve();

		return runRecipe.call(this, recipe)
			.then(() => {
				if (callback) callback();
				return this.runAll(callback);
			});
	}
};

module.exports = function(recipe, storage){
	return new Pager(recipe, storage);
};

function pushListRecipe(listURL, page){
	this.taskQueue.push({
		type: 'list',
		page: page || 1,
		url: listURL || this.recipe.listURL
	});
}

function pushDetailRecipe(detailURL, id){
	this.taskQueue.push({
		type: 'detail',
		id: id,
		url: detailURL
	});
}

function getPhantom() {
	if (this.phantom) {
		return this.phantom.createPage();
	}

	// make reusable phantom instance
	let promise = phantom.create(['--ignore-ssl-errors=yes', '--load-images=no'], {
			logLevel: 'error'
		})
		.then(instance => {
			this.phantom = instance;
		})
		.then(() => this.phantom.createPage());

	// login page process
	if (this.recipe.loginURL) {
		let _page;

		promise = promise.then(page => {
			_page = page;
			return page.open(this.recipe.loginURL)
		})
		.then(() => _page.property('onLoadFinished'))
		.then(() => {
			return _page.evaluate(this.recipe.login)
				.then(() => {
					return new Promise((resolve,reject)=>{
						let waits = 0, oldURL = null;
						let handler = setInterval(function(){

							_page.property('url').then(url => {

								if (oldURL && url != oldURL) {
									resolve();
									clearInterval(handler);

								} else if (waits++ > 10) {
									reject();
									clearInterval(handler);
								}

								oldURL = url;
							});

						}, 500);
					});
				});
		})
		.then(() => _page.property('cookies'))
		.then(cookies => {
			this.cookies = this.cookies.concat(cookies);
			_page.close();
			return this.phantom.createPage();
		});
	}

	return promise;
}

function exitPhantom(){
	this.phantom.exit();
}

function runRecipe(taskRecipe){

	let _page;

	return new Promise((resolve, reject) => {

		getPhantom.call(this)
	    .then(page => {
        _page = page;
        // apply cookies
        this.cookies.forEach(cookie => page.addCookie(cookie));
        return page.open(taskRecipe.url)
	    })
    	.then(() => _page.property('onLoadFinished'))
    	.then(() => _page.property('content'))
	    .then(content => {
        _page.close();

        // evaluate
        let $ = cheerio.load(content, {decodeEntities: false});

        if (taskRecipe.type == 'list') {

      		let data = this.recipe.evaluateList($);

        	if (!(data instanceof Array) &&
        		(!data.toArray || !((data = data.toArray()) instanceof Array)))
        			throw new Error("List-Recipe is not evaluated as an array");

	        if (data.length > 0 && typeof data[0].id == 'undefined')
	        	throw new Error("An object should have id [, url] property");

	        // get details of objects
	        let savePromises = [];
	        for(let i=0; i<data.length; i++) {
	        	let d = data[i];
						savePromises.push(this.storage.save(d.id, d));

	        	// object has url property
	        	if (d.url) {
	        		pushDetailRecipe.call(this, d.url, d.id);
	        	}
	        }

	        // paginate list
        	if (this.recipe.paginateList && (!this.recipe.maxListPage || this.recipe.maxListPage > taskRecipe.page)) {
        		let prevURL = this.recipe.paginateList($);
        		if (prevURL) {
        			pushListRecipe.call(this, prevURL, taskRecipe.page+1);
        		}
        	}

        	Promise.all(savePromises)
	        	.then(() => {
	        		resolve();
	        	})
	        	.catch(err => {
	        		reject(err);
	        	});

	      } else if (taskRecipe.type == 'detail') {

        	let data = this.recipe.evaluateDetail($);

        	if (!(data instanceof Object))
        		throw new Error("Detail-Recipe is not evaludated as an object");

        	this.storage.save(taskRecipe.id, data, true)
        		.then(() => {
	        		resolve();
	        	})
	        	.catch(err => {
	        		reject(err);
	        	});
				}

				this.runCount++;
	    })

	    .catch(err => {
        exitPhantom.call(this);
        reject(err);
        console.error(err);
	    });
	});
}