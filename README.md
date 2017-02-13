# Pager: Fast and storable web-crawler based on PhantomJs

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
const Storage = require('./services/pager-storage'); // memory storage, you can use something like mysql-storage
let storage = new Storage();
let page1 = pager(recipeForNaverNews, storage);

page1
  .runAll() // then, all crawled data are saved on storage
  .then(pager1.fetchAll)
  .then(data => {
    // ...
  });
```

### example result
```json
[
  {
    "id": "oid=001&aid=0008856157&sid1=105",
    "url": "http://m.news.naver.com/rankingRead.nhn?oid=001&aid=0008856157&sid1=105&date=20161129&ntype=RANKING",
    "title": "삼성전자, 갤노트7 발화 원인 연내 발표한다",
    "author": "기사입력 2016.11.29 오후 4:56\n\t\t최종수정 2016.11.29 오후 4:58",
    "contents": "차기작 S8 신뢰확보에 큰 도움 될 듯(서울=연합뉴스) 임화섭 기자 = 삼성전자가 발화 위험으로 2차례에 걸쳐 전량 리콜됐던 갤럭시노트7의 발화 원인을 올해 안에 발표키로 했다.    29일 삼성전자 관계자들에 따르면 이 회사는 한국 국가기술표준원, 한국산업기술시험원, 미국 규제기관인 소비자제품안전위원회(CPSC), 미국의 안전 컨설팅·인증업체 UL 등과 함께 지난달부터 진행해 온 발화 원인 조사를 올해 내로 마무리하기로 했다.    삼성전자는 1차 물량 발화 직후인 9월에는 배터리 제조업체 삼성 SDI의 공정 문제에 따른 배터리 셀 결함을 원인으로 지목했으나, 이후 중국 ATL에서 생산된 2차 물량 배터리에서도 결함이 발견되자 원점에서 다시 원인 규명을 진행중이다.    이 회사는 국내외에서 화재가 발생한 기기들을 최대한 많이 수거해 정밀 검증을 벌이고 있다.     삼성전자 관계자는 \"모든 가능성을 열어 두고 선입견 없이 면밀하게 발화 원인을 조사 중\"이라고 설명했다.    만약 삼성전자가 갤럭시노트7의 발화 원인을 세부 공정 단위까지 명쾌히 밝혀내는 데 성공한다면 내년에 나올 갤럭시 S8의 안전성과 소비자 신뢰를 확보하는 데에도 큰 도움이 될 전망이다.    또 리콜된 430만대의 갤럭시노트7의 재활용이 가능한지 여부를 판단하는 데도 결정적 요인이 될 것으로 예상된다.\n    \n\t\t\n\t\n갤럭시노트7 CG 화면[연합뉴스TV제공=연합뉴스]    solatido@yna.co.kr"
  },
  {
    "id": "oid=421&aid=0002418735&sid1=105",
    "url": "http://m.news.naver.com/rankingRead.nhn?oid=421&aid=0002418735&sid1=105&date=20161129&ntype=RANKING",
    "title": "역대 최강 '갤럭시S8' 100만원 넘을까…벌써 가격 관심",
    "author": "기사입력 2016.11.29 오전 8:05\n\t\t최종수정 2016.11.29 오전 8:06",
    "contents": "갤럭시S8 예상 이미지 © News1(서울=뉴스1) 김보람 기자 = 내년 상반기 출시될 삼성전자 전략 스마트폰 '갤럭시S8' 가격에 대한 관심이 벌써부터 쏠리고 있다. 갤럭시S8은 전작에 없던 디자인과 기능이 대거 탑재됨에 따라 제조 원가가 크게 상승해 100만원을 웃돌 것으로 관측된다. 그러나 배터리 발화로 단종된 '갤럭시노트7' 여파로 시장 반응이 어느 때보다 민감해서 가격을 섣불리 올릴 수 없을 것이라는 견해도 만만찮다.현재까지 국내외에서 거론된 갤S8의 예상 성능은 Δ4K UHD 해상도 무 베젤(화면을 둘러싼 테두리) 디스플레이 Δ인공지능(AI) 음성비서 탑재 Δ후면 듀얼 카메라 등이 있다. 갤S6과 갤S7의 쿼드HD 해상도보다 4K 울트라HD로 한단계 향상은 물론 삼성전자에서 최초 시도하는 무 베젤 디스플레이는 전면부 95% 이상을 디스플레이로 덮어야 하는 만큼 전작에서 유지했던 생산공정도 바꿔야 하므로 가격 상승을 피할 수 없을 것이란 게 업계의 분석이다.여기에 애플 아이폰을 비롯해 '듀얼카메라'를 탑재하는 글로벌 경쟁작이 늘어남에 따라 삼성전자 역시 카메라 성능 향상은 필수과제로 남아있다. 업계는 갤S8에 후면 듀얼카메라 탑재와 전면 카메라 화소수 향상, 카메라 모듈 크기 확대 등을 예상하고 있다. 이에 따라 업계는 갤S8의 제조원가가 전작 갤S7 대비 250달러(약 30만원)에서 320달러(약 37만원)까지 상승할 것으로 예상하고 있다. 삼성전자는 노트7을 출시하며 최초 홍채인식 도입, 강화된 S펜 기능, 방수·방진 기능, 엣지 디자인 적용, 64기가바이트(GB) 대용량, 배터리 용량 확대 등 최강 스펙을 탑재해 국내 출고가를 전작 대비 2만3100원 비싼 98만8900원으로 정한 바 있다.하지만 노트7 여파로 글로벌 시장의 반응이 어느 때보다 민감한 상황이기 때문에 삼성전자가 가격을 섣불리 올릴 수 없을 것이란 게 업계의 관측이다. 때문에 삼성전자가 반드시 필요한 성능은 향상하면서도 다른 부품의 원가를 줄여 가격을 낮추는 데 주력할 수 있다는 분석이 나오고 있다. 삼성전자는 앞서 갤S7의 성능을 강화하기 위해 필요한 부품만 개선해 갤S6보다 원가 부담을 크게 줄여 이익개선 효과를 이끌어냈다는 평을 받았다. 출고가 역시 전작 대비 낮아졌다. 갤S7 출고가는 32기가바이트(GB) 83만6000원, 64GB는 88만원으로 전작 대비 2만2000원 낮아졌다. 갤S7엣지 32GB는 92만4000원, 64GB는 96만8000원으로 전작 대비 5만5000원 내려갔다.황민성 삼성증권 애널리스트는 \"제조원가 상승의 주범이 디스플레이·애플리케이션프로세서(AP)·램(RAM)이라면, 삼성전자가 128GB 없이 32GB, 64GB을 유지하는 대신 소비자의 마이크로SD카드 사용을 권장해 가격 상승을 최대한 막는 방법을 취할 수 있다\"고 설명했다.삼성전자 관계자는 \"삼성전자가 살아 남기 위해서는 갤S8은 뛰어난 품질의 최고 역작으로 만들면서도 가격 경쟁력을 갖춰야 한다\"고 강조해 성능 향상과 원가 절감의 중요성을 드러냈다. 한편, 갤S8은 당초 예상했던 내년 3월에서 미뤄져 4월 출시될 것으로 점쳐진다. 삼성전자가 아직 노트7의 발화원인을 밝히지 못한데다 갤S8 준비에 좀더 많은 시간을 할애하고 있기 때문이다. 이에 따라 내년 2월말 스페인에서 열리는 '모바일 월드 콩그레스(MWC) 2017'에서 갤S8 공개가 어려울 전망이다.borami@news1.kr▶ 매일 업데이트 최신 만화 100% 무료[© 뉴스1코리아(news1.kr), 무단 전재 및 재배포 금지]"
  },
  {
    "id": "oid=081&aid=0002778181&sid1=105",
    "url": "http://m.news.naver.com/rankingRead.nhn?oid=081&aid=0002778181&sid1=105&date=20161129&ntype=RANKING",
    "title": "사라져버린 ‘태양 흑점’…지구 대재앙의 예고?",
    "author": "기사입력 2016.11.29 오후 3:26\n\t\t최종수정 2016.11.29 오후 3:32",
    "contents": "[서울신문 나우뉴스]\n    \n\t\t\n\t\n지옥같은 모습으로 이글이글 타오르는 태양. 그러나 태양의 표면이 마치 화장한 듯 깨끗한 모습으로 관측됐다.최근 미 항공우주국(NASA)은 태양활동관측위성(SDO)이 촬영한 태양의 모습을 사진과 영상으로 공개했다. 이 사진은 지난 14~18일 사이 SDO가 태양의 활동 모습을 촬영한 것으로 보통 검게 나타나는 흑점이 거의 보이지 않는 것이 특징이다.강력한 자기장이 만들어내는 태양의 흑점은 주변 표면보다 1000℃ 정도 온도가 낮아서 검게 보이는 것으로, 중심부에서 용암이 흘러나오듯 플라즈마가 분출된다. 특히 흑점 관측이 중요한 이유는 흑점이 많을수록 태양 활동이 왕성해지기 때문이다. 곧 흑점이 많아지면(태양 활동이 왕성하면) 지구는 태양으로부터 받는 에너지가 많아지고 적으면 그 반대가 된다.실제로 흑점이 보이지 않으면 지구의 기온이 약간 떨어져 지구에 악영향을 미치기도 하는데 이는 역사적인 기록에도 남아있다. 과거 1000년 동안 태양 흑점이 장기간 사라진 것은 최소 3차례로, 이후 큰 가뭄이 들었다. 조선왕조실록에도 흑점이 관측되지 않았던 15세기 10여 년에 걸쳐 대가뭄이 이어졌다고 기록하고 있다.　\n    \n\t\t\n\t\n폭발하는 태양 흑점의 모습그렇다면 이번 태양 흑점이 사라지는 현상 역시 지구에 불길한 기운이 닥친다는 것을 예고하는 것일까?전문가들에 따르면 태양 흑점이 사라지는 것도 과학적인 이유가 있다. 태양은 11년을 주기(Solar Cycle)로 활동하는데 흑점수가 최대치에 이를 때를 ‘태양 극대기’(solar maximum) 그 반대일 때를 ‘태양 극소기’(solar minimum)라 부른다. 곧 지난 2013년~2014년 초 태양은 극대기에 해당됐으며 당시 지구는 흑점 폭발로 인한 단파통신 두절, 위성장애, 위성항법장치 오류, 전력망 손상 등을 걱정해야 했다.이와 반대로 지금은 태양 극소기로 접어들어 흑점 활동이 줄어들었을 뿐 또다시 흑점이 이글이글 타오를 것이라는 것이 NASA의 전망이다.그러나 일부 학계에서는 지구에 미니 빙하기가 올 수도 있다는 논문도 내놓고 있다. 지난해 영국 노섬브리어대학 태양과학자 발렌티나 자르코바 교수는 태양 활동에 대한 분석을 토대로 태양 활동이 2030년 무렵에 60% 감소해 10년 동안 미니 빙하기가 찾아올 것이라고 경고했다. 지구가 마지막으로 미니 빙하기를 겪은 것은 이른바 마운더 극소기(Maunder Minimum)로 불리던 시기로 지난 1645년부터 1715년까지 지속됐다.박종익 기자 pji@seoul.co.kr▶ [웰 메이드 N], 재미있는 세상[나우뉴스] ▶ [인기 무료만화] [페이스북]ⓒ 서울신문(www.seoul.co.kr), 무단전재 및 재배포금지"
  },
  ...
]
```
A task crawling 700 articles takes less than a minute.
