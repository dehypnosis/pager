module.exports = [
	 {
	 	name: 'naver news',
	 	schedule: {},

	 	 // option
	 	loginURL: 'https://nid.naver.com/nidlogin.login',
	 	login: function(){
	 		document.querySelector("#id").value = "ID";
			document.querySelector("#pw").value = "PW";
			document.querySelector("#frmNIDLogin input[type=submit]").click();
	 	},
	 	
	 	// mandatory
	 	listURL: 'http://m.news.naver.com/rankingList.nhn?sid1=105',
	 	evaluateList: function($){
			return $(".commonlist li").map((i,li) => {
				let href = $(li).find('a').attr('href').replace(/&amp;/g,'&'),
						url = 'http://m.news.naver.com'+href.replace('rankingList.nhn', 'rankingRead.nhn'),
						id = href.split('?')[1].split('&date')[0].replace(/&amp;/g,'&');
				return {
					id: id,
					url: url,
					title: $(li).find('.commonlist_tx_headline').text().trim()
				};
			});
	 	},

	 	// option
	 	maxListPage: 3,
	 	paginateList: function($){
	 		let href = $("#defaultPageNavigation .pg2_arrow_prev").attr('href').replace(/&amp;/g,'&');
	 		return (href) ? 'http://m.news.naver.com'+href : null;
	 	},
	 	evaluateDetail: function($){
			return {
				author: $(".author").text().trim(),
				contents: $("#dic_area").text().trim()
			};
	 	}
	 }
];