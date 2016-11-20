const recipes = require('./models/recipes');
const pager = require('./services/pager');
const fs = require('fs');

let page1 = pager(recipes[0]), elapsed = getElapsedTime();

page1
	.runAll(() => console.log(`[${page1.getRunCount()}] ${page1.getTaskCount()} tasks left`))
	.then(() => page1.fetchAll())
	.then(data => {
		fs.writeFileSync('./page1.json', JSON.stringify(data, null, 2));
		console.log(`[${page1.getRecipe().name}] finished on ${elapsed()}`);
	})
	.then(() => page1.fetchAll(5, 2))
	.then(data => console.log(data.length))
	.catch(err => console.error(err))


function getElapsedTime(){
	let date = new Date();
	return () => {
		let secs = Math.floor((new Date - date)/1000),
				sec = secs % 60,
				min = (secs - sec) / 60,
				hour = (secs - sec - min*60) / 3600;
		return `${hour < 10 ? '0'+hour:hour}:${min < 10 ? '0'+min:min}:${sec < 10 ? '0'+sec:sec}`;
	};
}