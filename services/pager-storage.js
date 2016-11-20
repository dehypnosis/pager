// memory storage; see mandatory interface for Storage
class PagerStorage {
	constructor(){
		this.map = {};
	}

	fetchAll(offset, limit){
		let arr = []
		offset = offset || 0;
		limit = limit || 1000;

		let i = 0;
		for(let k in this.map) {
			if (i++ < offset) continue;
			if (i > offset + limit) break;

			arr.push(this.map[k]);
		}
		return Promise.resolve(arr);
	}

	fetch(id){
		return Promise.resolve(this.map[id] || null);
	}

	save(id, data, isUpdate){

		if (isUpdate) {
			for(let k in data) {
				this.map[id][k] = data[k];
			}
		} else {
			this.map[id] = data;
		}

		return Promise.resolve(data);
	}
}

module.exports = PagerStorage;