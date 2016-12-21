# Pager is a web-crawler based on PhantomJs

## Install
```bash
npm install
```

## TODO
* apply scheduling on recipe
* ~~abstract storage module from recipe~~
* add higher interface on recipe
* make minimal webserver (user, recipe, storage) and UI

## Usage

### make a recipe
```js
const recipeForNaverNews = {
  name: 'naver news',
  schedule: {},

   // option
  loginURL: 'https://nid.naver.com/nidlogin.login',

   // this function is injected as pure javascript into phantomjs
   login: function(){
    document.querySelector("#id").value = "ID";
    document.querySelector("#pw").value = "PW";
    document.querySelector("#frmNIDLogin input[type=submit]").click();
  },

  // mandatory
  listURL: 'http://m.news.naver.com/rankingList.nhn?sid1=105',
  
  // this function is evaluated as node script, and $ is (not jquery) jquery-like dom library; cheerio
  evaluateList: function($){ 
    return $(".commonlist li").map((i,li) => {
      let href = $(li).find('a').attr('href').replace(/&amp;/g,'&'),
          url = 'http://m.news.naver.com'+href.replace('rankingList.nhn', 'rankingRead.nhn'),
          id = href.split('?')[1].split('&date')[0].replace(/&amp;/g,'&');
      return {
        id: id,
        url: url, // to crawl deep page of target, pass deep page's
        title: $(li).find('.commonlist_tx_headline').text().trim()
      };
    });
  },

  // option
  maxListPage: 3,
  
  // to crawl whole page of target, pass next page's url on this function
  paginateList: function($){
    let href = $("#defaultPageNavigation .pg2_arrow_prev").attr('href').replace(/&amp;/g,'&');
    return (href) ? 'http://m.news.naver.com'+href : null;
  },

  // to crawl deep page of target; parser of deep page
  evaluateDetail: function($){
    return {
      author: $(".author").text().trim(),
      contents: $("#dic_area").text().trim()
    };
  }
 };
```

### cook the recipe
```js
const pager = require('./services/pager');
const Storage = require('./services/pager-storage'); // memory storage
let storage = new Storage();
let page1 = pager(recipeForNaverNews, storage);

page1
  .runAll() // then, all crawled data are saved on storage
  .then(pager1.fetchAll)
  .then(data => {
    // ...
  });
```
