import{r as b}from"./router-CMlNU3pY.js";const V=6048e5,U=864e5,P=43200,z=1440,j=Symbol.for("constructDateFrom");function k(t,e){return typeof t=="function"?t(e):t&&typeof t=="object"&&j in t?t[j](e):t instanceof Date?new t.constructor(e):new Date(e)}function y(t,e){return k(e||t,t)}function J(t,e,a){const n=y(t,a?.in);return isNaN(e)?k(t,NaN):(n.setDate(n.getDate()+e),n)}let Z={};function $(){return Z}function N(t,e){const a=$(),n=e?.weekStartsOn??e?.locale?.options?.weekStartsOn??a.weekStartsOn??a.locale?.options?.weekStartsOn??0,r=y(t,e?.in),c=r.getDay(),i=(c<n?7:0)+c-n;return r.setDate(r.getDate()-i),r.setHours(0,0,0,0),r}function C(t,e){return N(t,{...e,weekStartsOn:1})}function X(t,e){const a=y(t,e?.in),n=a.getFullYear(),r=k(a,0);r.setFullYear(n+1,0,4),r.setHours(0,0,0,0);const c=C(r),i=k(a,0);i.setFullYear(n,0,4),i.setHours(0,0,0,0);const s=C(i);return a.getTime()>=c.getTime()?n+1:a.getTime()>=s.getTime()?n:n-1}function S(t){const e=y(t),a=new Date(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate(),e.getHours(),e.getMinutes(),e.getSeconds(),e.getMilliseconds()));return a.setUTCFullYear(e.getFullYear()),+t-+a}function D(t,...e){const a=k.bind(null,t||e.find(n=>typeof n=="object"));return e.map(a)}function H(t,e){const a=y(t,e?.in);return a.setHours(0,0,0,0),a}function K(t,e,a){const[n,r]=D(a?.in,t,e),c=H(n),i=H(r),s=+c-S(c),u=+i-S(i);return Math.round((s-u)/U)}function tt(t,e){const a=X(t,e),n=k(t,0);return n.setFullYear(a,0,4),n.setHours(0,0,0,0),C(n)}function O(t,e){const a=+y(t)-+y(e);return a<0?-1:a>0?1:a}function T(t){return k(t,Date.now())}function R(t,e,a){const[n,r]=D(a?.in,t,e);return+H(n)==+H(r)}function et(t){return t instanceof Date||typeof t=="object"&&Object.prototype.toString.call(t)==="[object Date]"}function at(t){return!(!et(t)&&typeof t!="number"||isNaN(+y(t)))}function nt(t,e,a){const[n,r]=D(a?.in,t,e),c=n.getFullYear()-r.getFullYear(),i=n.getMonth()-r.getMonth();return c*12+i}function rt(t){return e=>{const n=(t?Math[t]:Math.trunc)(e);return n===0?0:n}}function ot(t,e){return+y(t)-+y(e)}function ct(t,e){const a=y(t,e?.in);return a.setHours(23,59,59,999),a}function st(t,e){const a=y(t,e?.in),n=a.getMonth();return a.setFullYear(a.getFullYear(),n+1,0),a.setHours(23,59,59,999),a}function it(t,e){const a=y(t,e?.in);return+ct(a,e)==+st(a,e)}function dt(t,e,a){const[n,r,c]=D(a?.in,t,t,e),i=O(r,c),s=Math.abs(nt(r,c));if(s<1)return 0;r.getMonth()===1&&r.getDate()>27&&r.setDate(30),r.setMonth(r.getMonth()-i*s);let u=O(r,c)===-i;it(n)&&s===1&&O(n,c)===1&&(u=!1);const f=i*(s-+u);return f===0?0:f}function ht(t,e,a){const n=ot(t,e)/1e3;return rt(a?.roundingMethod)(n)}function ut(t,e){const a=y(t,e?.in);return a.setFullYear(a.getFullYear(),0,1),a.setHours(0,0,0,0),a}const lt={lessThanXSeconds:{one:"less than a second",other:"less than {{count}} seconds"},xSeconds:{one:"1 second",other:"{{count}} seconds"},halfAMinute:"half a minute",lessThanXMinutes:{one:"less than a minute",other:"less than {{count}} minutes"},xMinutes:{one:"1 minute",other:"{{count}} minutes"},aboutXHours:{one:"about 1 hour",other:"about {{count}} hours"},xHours:{one:"1 hour",other:"{{count}} hours"},xDays:{one:"1 day",other:"{{count}} days"},aboutXWeeks:{one:"about 1 week",other:"about {{count}} weeks"},xWeeks:{one:"1 week",other:"{{count}} weeks"},aboutXMonths:{one:"about 1 month",other:"about {{count}} months"},xMonths:{one:"1 month",other:"{{count}} months"},aboutXYears:{one:"about 1 year",other:"about {{count}} years"},xYears:{one:"1 year",other:"{{count}} years"},overXYears:{one:"over 1 year",other:"over {{count}} years"},almostXYears:{one:"almost 1 year",other:"almost {{count}} years"}},yt=(t,e,a)=>{let n;const r=lt[t];return typeof r=="string"?n=r:e===1?n=r.one:n=r.other.replace("{{count}}",e.toString()),a?.addSuffix?a.comparison&&a.comparison>0?"in "+n:n+" ago":n};function W(t){return(e={})=>{const a=e.width?String(e.width):t.defaultWidth;return t.formats[a]||t.formats[t.defaultWidth]}}const ft={full:"EEEE, MMMM do, y",long:"MMMM do, y",medium:"MMM d, y",short:"MM/dd/yyyy"},mt={full:"h:mm:ss a zzzz",long:"h:mm:ss a z",medium:"h:mm:ss a",short:"h:mm a"},kt={full:"{{date}} 'at' {{time}}",long:"{{date}} 'at' {{time}}",medium:"{{date}}, {{time}}",short:"{{date}}, {{time}}"},pt={date:W({formats:ft,defaultWidth:"full"}),time:W({formats:mt,defaultWidth:"full"}),dateTime:W({formats:kt,defaultWidth:"full"})},gt={lastWeek:"'last' eeee 'at' p",yesterday:"'yesterday at' p",today:"'today at' p",tomorrow:"'tomorrow at' p",nextWeek:"eeee 'at' p",other:"P"},Mt=(t,e,a,n)=>gt[t];function v(t){return(e,a)=>{const n=a?.context?String(a.context):"standalone";let r;if(n==="formatting"&&t.formattingValues){const i=t.defaultFormattingWidth||t.defaultWidth,s=a?.width?String(a.width):i;r=t.formattingValues[s]||t.formattingValues[i]}else{const i=t.defaultWidth,s=a?.width?String(a.width):t.defaultWidth;r=t.values[s]||t.values[i]}const c=t.argumentCallback?t.argumentCallback(e):e;return r[c]}}const wt={narrow:["B","A"],abbreviated:["BC","AD"],wide:["Before Christ","Anno Domini"]},_t={narrow:["1","2","3","4"],abbreviated:["Q1","Q2","Q3","Q4"],wide:["1st quarter","2nd quarter","3rd quarter","4th quarter"]},vt={narrow:["J","F","M","A","M","J","J","A","S","O","N","D"],abbreviated:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],wide:["January","February","March","April","May","June","July","August","September","October","November","December"]},xt={narrow:["S","M","T","W","T","F","S"],short:["Su","Mo","Tu","We","Th","Fr","Sa"],abbreviated:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],wide:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]},bt={narrow:{am:"a",pm:"p",midnight:"mi",noon:"n",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},abbreviated:{am:"AM",pm:"PM",midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},wide:{am:"a.m.",pm:"p.m.",midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"}},Nt={narrow:{am:"a",pm:"p",midnight:"mi",noon:"n",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"},abbreviated:{am:"AM",pm:"PM",midnight:"midnight",noon:"noon",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"},wide:{am:"a.m.",pm:"p.m.",midnight:"midnight",noon:"noon",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"}},$t=(t,e)=>{const a=Number(t),n=a%100;if(n>20||n<10)switch(n%10){case 1:return a+"st";case 2:return a+"nd";case 3:return a+"rd"}return a+"th"},Dt={ordinalNumber:$t,era:v({values:wt,defaultWidth:"wide"}),quarter:v({values:_t,defaultWidth:"wide",argumentCallback:t=>t-1}),month:v({values:vt,defaultWidth:"wide"}),day:v({values:xt,defaultWidth:"wide"}),dayPeriod:v({values:bt,defaultWidth:"wide",formattingValues:Nt,defaultFormattingWidth:"wide"})};function x(t){return(e,a={})=>{const n=a.width,r=n&&t.matchPatterns[n]||t.matchPatterns[t.defaultMatchWidth],c=e.match(r);if(!c)return null;const i=c[0],s=n&&t.parsePatterns[n]||t.parsePatterns[t.defaultParseWidth],u=Array.isArray(s)?Ot(s,l=>l.test(i)):Pt(s,l=>l.test(i));let f;f=t.valueCallback?t.valueCallback(u):u,f=a.valueCallback?a.valueCallback(f):f;const h=e.slice(i.length);return{value:f,rest:h}}}function Pt(t,e){for(const a in t)if(Object.prototype.hasOwnProperty.call(t,a)&&e(t[a]))return a}function Ot(t,e){for(let a=0;a<t.length;a++)if(e(t[a]))return a}function Ct(t){return(e,a={})=>{const n=e.match(t.matchPattern);if(!n)return null;const r=n[0],c=e.match(t.parsePattern);if(!c)return null;let i=t.valueCallback?t.valueCallback(c[0]):c[0];i=a.valueCallback?a.valueCallback(i):i;const s=e.slice(r.length);return{value:i,rest:s}}}const St=/^(\d+)(th|st|nd|rd)?/i,Ht=/\d+/i,qt={narrow:/^(b|a)/i,abbreviated:/^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,wide:/^(before christ|before common era|anno domini|common era)/i},Wt={any:[/^b/i,/^(a|c)/i]},Tt={narrow:/^[1234]/i,abbreviated:/^q[1234]/i,wide:/^[1234](th|st|nd|rd)? quarter/i},zt={any:[/1/i,/2/i,/3/i,/4/i]},jt={narrow:/^[jfmasond]/i,abbreviated:/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,wide:/^(january|february|march|april|may|june|july|august|september|october|november|december)/i},Yt={narrow:[/^j/i,/^f/i,/^m/i,/^a/i,/^m/i,/^j/i,/^j/i,/^a/i,/^s/i,/^o/i,/^n/i,/^d/i],any:[/^ja/i,/^f/i,/^mar/i,/^ap/i,/^may/i,/^jun/i,/^jul/i,/^au/i,/^s/i,/^o/i,/^n/i,/^d/i]},Lt={narrow:/^[smtwf]/i,short:/^(su|mo|tu|we|th|fr|sa)/i,abbreviated:/^(sun|mon|tue|wed|thu|fri|sat)/i,wide:/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i},At={narrow:[/^s/i,/^m/i,/^t/i,/^w/i,/^t/i,/^f/i,/^s/i],any:[/^su/i,/^m/i,/^tu/i,/^w/i,/^th/i,/^f/i,/^sa/i]},Et={narrow:/^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,any:/^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i},Ft={any:{am:/^a/i,pm:/^p/i,midnight:/^mi/i,noon:/^no/i,morning:/morning/i,afternoon:/afternoon/i,evening:/evening/i,night:/night/i}},Vt={ordinalNumber:Ct({matchPattern:St,parsePattern:Ht,valueCallback:t=>parseInt(t,10)}),era:x({matchPatterns:qt,defaultMatchWidth:"wide",parsePatterns:Wt,defaultParseWidth:"any"}),quarter:x({matchPatterns:Tt,defaultMatchWidth:"wide",parsePatterns:zt,defaultParseWidth:"any",valueCallback:t=>t+1}),month:x({matchPatterns:jt,defaultMatchWidth:"wide",parsePatterns:Yt,defaultParseWidth:"any"}),day:x({matchPatterns:Lt,defaultMatchWidth:"wide",parsePatterns:At,defaultParseWidth:"any"}),dayPeriod:x({matchPatterns:Et,defaultMatchWidth:"any",parsePatterns:Ft,defaultParseWidth:"any"})},B={code:"en-US",formatDistance:yt,formatLong:pt,formatRelative:Mt,localize:Dt,match:Vt,options:{weekStartsOn:0,firstWeekContainsDate:1}};function Xt(t,e){const a=y(t,e?.in);return K(a,ut(a))+1}function Rt(t,e){const a=y(t,e?.in),n=+C(a)-+tt(a);return Math.round(n/V)+1}function I(t,e){const a=y(t,e?.in),n=a.getFullYear(),r=$(),c=e?.firstWeekContainsDate??e?.locale?.options?.firstWeekContainsDate??r.firstWeekContainsDate??r.locale?.options?.firstWeekContainsDate??1,i=k(e?.in||t,0);i.setFullYear(n+1,0,c),i.setHours(0,0,0,0);const s=N(i,e),u=k(e?.in||t,0);u.setFullYear(n,0,c),u.setHours(0,0,0,0);const f=N(u,e);return+a>=+s?n+1:+a>=+f?n:n-1}function Bt(t,e){const a=$(),n=e?.firstWeekContainsDate??e?.locale?.options?.firstWeekContainsDate??a.firstWeekContainsDate??a.locale?.options?.firstWeekContainsDate??1,r=I(t,e),c=k(e?.in||t,0);return c.setFullYear(r,0,n),c.setHours(0,0,0,0),N(c,e)}function It(t,e){const a=y(t,e?.in),n=+N(a,e)-+Bt(a,e);return Math.round(n/V)+1}function d(t,e){const a=t<0?"-":"",n=Math.abs(t).toString().padStart(e,"0");return a+n}const g={y(t,e){const a=t.getFullYear(),n=a>0?a:1-a;return d(e==="yy"?n%100:n,e.length)},M(t,e){const a=t.getMonth();return e==="M"?String(a+1):d(a+1,2)},d(t,e){return d(t.getDate(),e.length)},a(t,e){const a=t.getHours()/12>=1?"pm":"am";switch(e){case"a":case"aa":return a.toUpperCase();case"aaa":return a;case"aaaaa":return a[0];case"aaaa":default:return a==="am"?"a.m.":"p.m."}},h(t,e){return d(t.getHours()%12||12,e.length)},H(t,e){return d(t.getHours(),e.length)},m(t,e){return d(t.getMinutes(),e.length)},s(t,e){return d(t.getSeconds(),e.length)},S(t,e){const a=e.length,n=t.getMilliseconds(),r=Math.trunc(n*Math.pow(10,a-3));return d(r,e.length)}},_={midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},Y={G:function(t,e,a){const n=t.getFullYear()>0?1:0;switch(e){case"G":case"GG":case"GGG":return a.era(n,{width:"abbreviated"});case"GGGGG":return a.era(n,{width:"narrow"});case"GGGG":default:return a.era(n,{width:"wide"})}},y:function(t,e,a){if(e==="yo"){const n=t.getFullYear(),r=n>0?n:1-n;return a.ordinalNumber(r,{unit:"year"})}return g.y(t,e)},Y:function(t,e,a,n){const r=I(t,n),c=r>0?r:1-r;if(e==="YY"){const i=c%100;return d(i,2)}return e==="Yo"?a.ordinalNumber(c,{unit:"year"}):d(c,e.length)},R:function(t,e){const a=X(t);return d(a,e.length)},u:function(t,e){const a=t.getFullYear();return d(a,e.length)},Q:function(t,e,a){const n=Math.ceil((t.getMonth()+1)/3);switch(e){case"Q":return String(n);case"QQ":return d(n,2);case"Qo":return a.ordinalNumber(n,{unit:"quarter"});case"QQQ":return a.quarter(n,{width:"abbreviated",context:"formatting"});case"QQQQQ":return a.quarter(n,{width:"narrow",context:"formatting"});case"QQQQ":default:return a.quarter(n,{width:"wide",context:"formatting"})}},q:function(t,e,a){const n=Math.ceil((t.getMonth()+1)/3);switch(e){case"q":return String(n);case"qq":return d(n,2);case"qo":return a.ordinalNumber(n,{unit:"quarter"});case"qqq":return a.quarter(n,{width:"abbreviated",context:"standalone"});case"qqqqq":return a.quarter(n,{width:"narrow",context:"standalone"});case"qqqq":default:return a.quarter(n,{width:"wide",context:"standalone"})}},M:function(t,e,a){const n=t.getMonth();switch(e){case"M":case"MM":return g.M(t,e);case"Mo":return a.ordinalNumber(n+1,{unit:"month"});case"MMM":return a.month(n,{width:"abbreviated",context:"formatting"});case"MMMMM":return a.month(n,{width:"narrow",context:"formatting"});case"MMMM":default:return a.month(n,{width:"wide",context:"formatting"})}},L:function(t,e,a){const n=t.getMonth();switch(e){case"L":return String(n+1);case"LL":return d(n+1,2);case"Lo":return a.ordinalNumber(n+1,{unit:"month"});case"LLL":return a.month(n,{width:"abbreviated",context:"standalone"});case"LLLLL":return a.month(n,{width:"narrow",context:"standalone"});case"LLLL":default:return a.month(n,{width:"wide",context:"standalone"})}},w:function(t,e,a,n){const r=It(t,n);return e==="wo"?a.ordinalNumber(r,{unit:"week"}):d(r,e.length)},I:function(t,e,a){const n=Rt(t);return e==="Io"?a.ordinalNumber(n,{unit:"week"}):d(n,e.length)},d:function(t,e,a){return e==="do"?a.ordinalNumber(t.getDate(),{unit:"date"}):g.d(t,e)},D:function(t,e,a){const n=Xt(t);return e==="Do"?a.ordinalNumber(n,{unit:"dayOfYear"}):d(n,e.length)},E:function(t,e,a){const n=t.getDay();switch(e){case"E":case"EE":case"EEE":return a.day(n,{width:"abbreviated",context:"formatting"});case"EEEEE":return a.day(n,{width:"narrow",context:"formatting"});case"EEEEEE":return a.day(n,{width:"short",context:"formatting"});case"EEEE":default:return a.day(n,{width:"wide",context:"formatting"})}},e:function(t,e,a,n){const r=t.getDay(),c=(r-n.weekStartsOn+8)%7||7;switch(e){case"e":return String(c);case"ee":return d(c,2);case"eo":return a.ordinalNumber(c,{unit:"day"});case"eee":return a.day(r,{width:"abbreviated",context:"formatting"});case"eeeee":return a.day(r,{width:"narrow",context:"formatting"});case"eeeeee":return a.day(r,{width:"short",context:"formatting"});case"eeee":default:return a.day(r,{width:"wide",context:"formatting"})}},c:function(t,e,a,n){const r=t.getDay(),c=(r-n.weekStartsOn+8)%7||7;switch(e){case"c":return String(c);case"cc":return d(c,e.length);case"co":return a.ordinalNumber(c,{unit:"day"});case"ccc":return a.day(r,{width:"abbreviated",context:"standalone"});case"ccccc":return a.day(r,{width:"narrow",context:"standalone"});case"cccccc":return a.day(r,{width:"short",context:"standalone"});case"cccc":default:return a.day(r,{width:"wide",context:"standalone"})}},i:function(t,e,a){const n=t.getDay(),r=n===0?7:n;switch(e){case"i":return String(r);case"ii":return d(r,e.length);case"io":return a.ordinalNumber(r,{unit:"day"});case"iii":return a.day(n,{width:"abbreviated",context:"formatting"});case"iiiii":return a.day(n,{width:"narrow",context:"formatting"});case"iiiiii":return a.day(n,{width:"short",context:"formatting"});case"iiii":default:return a.day(n,{width:"wide",context:"formatting"})}},a:function(t,e,a){const r=t.getHours()/12>=1?"pm":"am";switch(e){case"a":case"aa":return a.dayPeriod(r,{width:"abbreviated",context:"formatting"});case"aaa":return a.dayPeriod(r,{width:"abbreviated",context:"formatting"}).toLowerCase();case"aaaaa":return a.dayPeriod(r,{width:"narrow",context:"formatting"});case"aaaa":default:return a.dayPeriod(r,{width:"wide",context:"formatting"})}},b:function(t,e,a){const n=t.getHours();let r;switch(n===12?r=_.noon:n===0?r=_.midnight:r=n/12>=1?"pm":"am",e){case"b":case"bb":return a.dayPeriod(r,{width:"abbreviated",context:"formatting"});case"bbb":return a.dayPeriod(r,{width:"abbreviated",context:"formatting"}).toLowerCase();case"bbbbb":return a.dayPeriod(r,{width:"narrow",context:"formatting"});case"bbbb":default:return a.dayPeriod(r,{width:"wide",context:"formatting"})}},B:function(t,e,a){const n=t.getHours();let r;switch(n>=17?r=_.evening:n>=12?r=_.afternoon:n>=4?r=_.morning:r=_.night,e){case"B":case"BB":case"BBB":return a.dayPeriod(r,{width:"abbreviated",context:"formatting"});case"BBBBB":return a.dayPeriod(r,{width:"narrow",context:"formatting"});case"BBBB":default:return a.dayPeriod(r,{width:"wide",context:"formatting"})}},h:function(t,e,a){if(e==="ho"){let n=t.getHours()%12;return n===0&&(n=12),a.ordinalNumber(n,{unit:"hour"})}return g.h(t,e)},H:function(t,e,a){return e==="Ho"?a.ordinalNumber(t.getHours(),{unit:"hour"}):g.H(t,e)},K:function(t,e,a){const n=t.getHours()%12;return e==="Ko"?a.ordinalNumber(n,{unit:"hour"}):d(n,e.length)},k:function(t,e,a){let n=t.getHours();return n===0&&(n=24),e==="ko"?a.ordinalNumber(n,{unit:"hour"}):d(n,e.length)},m:function(t,e,a){return e==="mo"?a.ordinalNumber(t.getMinutes(),{unit:"minute"}):g.m(t,e)},s:function(t,e,a){return e==="so"?a.ordinalNumber(t.getSeconds(),{unit:"second"}):g.s(t,e)},S:function(t,e){return g.S(t,e)},X:function(t,e,a){const n=t.getTimezoneOffset();if(n===0)return"Z";switch(e){case"X":return A(n);case"XXXX":case"XX":return M(n);case"XXXXX":case"XXX":default:return M(n,":")}},x:function(t,e,a){const n=t.getTimezoneOffset();switch(e){case"x":return A(n);case"xxxx":case"xx":return M(n);case"xxxxx":case"xxx":default:return M(n,":")}},O:function(t,e,a){const n=t.getTimezoneOffset();switch(e){case"O":case"OO":case"OOO":return"GMT"+L(n,":");case"OOOO":default:return"GMT"+M(n,":")}},z:function(t,e,a){const n=t.getTimezoneOffset();switch(e){case"z":case"zz":case"zzz":return"GMT"+L(n,":");case"zzzz":default:return"GMT"+M(n,":")}},t:function(t,e,a){const n=Math.trunc(+t/1e3);return d(n,e.length)},T:function(t,e,a){return d(+t,e.length)}};function L(t,e=""){const a=t>0?"-":"+",n=Math.abs(t),r=Math.trunc(n/60),c=n%60;return c===0?a+String(r):a+String(r)+e+d(c,2)}function A(t,e){return t%60===0?(t>0?"-":"+")+d(Math.abs(t)/60,2):M(t,e)}function M(t,e=""){const a=t>0?"-":"+",n=Math.abs(t),r=d(Math.trunc(n/60),2),c=d(n%60,2);return a+r+e+c}const E=(t,e)=>{switch(t){case"P":return e.date({width:"short"});case"PP":return e.date({width:"medium"});case"PPP":return e.date({width:"long"});case"PPPP":default:return e.date({width:"full"})}},G=(t,e)=>{switch(t){case"p":return e.time({width:"short"});case"pp":return e.time({width:"medium"});case"ppp":return e.time({width:"long"});case"pppp":default:return e.time({width:"full"})}},Gt=(t,e)=>{const a=t.match(/(P+)(p+)?/)||[],n=a[1],r=a[2];if(!r)return E(t,e);let c;switch(n){case"P":c=e.dateTime({width:"short"});break;case"PP":c=e.dateTime({width:"medium"});break;case"PPP":c=e.dateTime({width:"long"});break;case"PPPP":default:c=e.dateTime({width:"full"});break}return c.replace("{{date}}",E(n,e)).replace("{{time}}",G(r,e))},Qt={p:G,P:Gt},Ut=/^D+$/,Jt=/^Y+$/,Zt=["D","DD","YY","YYYY"];function Kt(t){return Ut.test(t)}function te(t){return Jt.test(t)}function ee(t,e,a){const n=ae(t,e,a);if(console.warn(n),Zt.includes(t))throw new RangeError(n)}function ae(t,e,a){const n=t[0]==="Y"?"years":"days of the month";return`Use \`${t.toLowerCase()}\` instead of \`${t}\` (in \`${e}\`) for formatting ${n} to the input \`${a}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`}const ne=/[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,re=/P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,oe=/^'([^]*?)'?$/,ce=/''/g,se=/[a-zA-Z]/;function _n(t,e,a){const n=$(),r=n.locale??B,c=n.firstWeekContainsDate??n.locale?.options?.firstWeekContainsDate??1,i=n.weekStartsOn??n.locale?.options?.weekStartsOn??0,s=y(t,a?.in);if(!at(s))throw new RangeError("Invalid time value");let u=e.match(re).map(h=>{const l=h[0];if(l==="p"||l==="P"){const m=Qt[l];return m(h,r.formatLong)}return h}).join("").match(ne).map(h=>{if(h==="''")return{isToken:!1,value:"'"};const l=h[0];if(l==="'")return{isToken:!1,value:ie(h)};if(Y[l])return{isToken:!0,value:h};if(l.match(se))throw new RangeError("Format string contains an unescaped latin alphabet character `"+l+"`");return{isToken:!1,value:h}});r.localize.preprocessor&&(u=r.localize.preprocessor(s,u));const f={firstWeekContainsDate:c,weekStartsOn:i,locale:r};return u.map(h=>{if(!h.isToken)return h.value;const l=h.value;(te(l)||Kt(l))&&ee(l,e,String(t));const m=Y[l[0]];return m(s,l,r.localize,f)}).join("")}function ie(t){const e=t.match(oe);return e?e[1].replace(ce,"'"):t}function de(t,e,a){const n=$(),r=a?.locale??n.locale??B,c=2520,i=O(t,e);if(isNaN(i))throw new RangeError("Invalid time value");const s=Object.assign({},a,{addSuffix:a?.addSuffix,comparison:i}),[u,f]=D(a?.in,...i>0?[e,t]:[t,e]),h=ht(f,u),l=(S(f)-S(u))/1e3,m=Math.round((h-l)/60);let w;if(m<2)return a?.includeSeconds?h<5?r.formatDistance("lessThanXSeconds",5,s):h<10?r.formatDistance("lessThanXSeconds",10,s):h<20?r.formatDistance("lessThanXSeconds",20,s):h<40?r.formatDistance("halfAMinute",0,s):h<60?r.formatDistance("lessThanXMinutes",1,s):r.formatDistance("xMinutes",1,s):m===0?r.formatDistance("lessThanXMinutes",1,s):r.formatDistance("xMinutes",m,s);if(m<45)return r.formatDistance("xMinutes",m,s);if(m<90)return r.formatDistance("aboutXHours",1,s);if(m<z){const p=Math.round(m/60);return r.formatDistance("aboutXHours",p,s)}else{if(m<c)return r.formatDistance("xDays",1,s);if(m<P){const p=Math.round(m/z);return r.formatDistance("xDays",p,s)}else if(m<P*2)return w=Math.round(m/P),r.formatDistance("aboutXMonths",w,s)}if(w=dt(f,u),w<12){const p=Math.round(m/P);return r.formatDistance("xMonths",p,s)}else{const p=w%12,q=Math.trunc(w/12);return p<3?r.formatDistance("aboutXYears",q,s):p<9?r.formatDistance("overXYears",q,s):r.formatDistance("almostXYears",q+1,s)}}function vn(t,e){return de(t,T(t),e)}function xn(t,e){return R(k(t,t),T(t))}function bn(t,e){return R(t,J(T(t),1),e)}/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),ue=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,a,n)=>n?n.toUpperCase():a.toLowerCase()),F=t=>{const e=ue(t);return e.charAt(0).toUpperCase()+e.slice(1)},Q=(...t)=>t.filter((e,a,n)=>!!e&&e.trim()!==""&&n.indexOf(e)===a).join(" ").trim(),le=t=>{for(const e in t)if(e.startsWith("aria-")||e==="role"||e==="title")return!0};/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var ye={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=b.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:a=2,absoluteStrokeWidth:n,className:r="",children:c,iconNode:i,...s},u)=>b.createElement("svg",{ref:u,...ye,width:e,height:e,stroke:t,strokeWidth:n?Number(a)*24/Number(e):a,className:Q("lucide",r),...!c&&!le(s)&&{"aria-hidden":"true"},...s},[...i.map(([f,h])=>b.createElement(f,h)),...Array.isArray(c)?c:[c]]));/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=(t,e)=>{const a=b.forwardRef(({className:n,...r},c)=>b.createElement(fe,{ref:c,iconNode:e,className:Q(`lucide-${he(F(t))}`,`lucide-${t}`,n),...r}));return a.displayName=F(t),a};/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me=[["rect",{width:"20",height:"5",x:"2",y:"3",rx:"1",key:"1wp1u1"}],["path",{d:"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",key:"1s80jp"}],["path",{d:"M10 12h4",key:"a56b0p"}]],Nn=o("archive",me);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke=[["path",{d:"M17 7 7 17",key:"15tmo1"}],["path",{d:"M17 17H7V7",key:"1org7z"}]],$n=o("arrow-down-left",ke);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]],Dn=o("arrow-down-right",pe);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=[["path",{d:"M8 3 4 7l4 4",key:"9rb6wj"}],["path",{d:"M4 7h16",key:"6tx8e3"}],["path",{d:"m16 21 4-4-4-4",key:"siv7j2"}],["path",{d:"M20 17H4",key:"h6l3hr"}]],Pn=o("arrow-left-right",ge);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],On=o("arrow-left",Me);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],Cn=o("arrow-right",we);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]],Sn=o("arrow-up-right",_e);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve=[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]],Hn=o("award",ve);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],qn=o("bell",xe);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]],Wn=o("book-open",be);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ne=[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",key:"1fy3hk"}]],Tn=o("bookmark",Ne);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]],zn=o("briefcase",$e);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],jn=o("building-2",De);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]],Yn=o("calculator",Pe);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]],Ln=o("calendar-days",Oe);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce=[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M17 14h-6",key:"bkmgh3"}],["path",{d:"M13 18H7",key:"bb0bb7"}],["path",{d:"M7 14h.01",key:"1qa3f1"}],["path",{d:"M17 18h.01",key:"1bdyru"}]],An=o("calendar-range",Ce);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],En=o("calendar",Se);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]],Fn=o("chart-column",He);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qe=[["path",{d:"M5 21v-6",key:"1hz6c0"}],["path",{d:"M12 21V3",key:"1lcnhd"}],["path",{d:"M19 21V9",key:"unv183"}]],Vn=o("chart-no-axes-column",qe);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=[["path",{d:"M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z",key:"pzmjnu"}],["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}]],Xn=o("chart-pie",We);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],Rn=o("check",Te);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],Bn=o("chevron-down",ze);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],In=o("chevron-left",je);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],Gn=o("chevron-right",Ye);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]],Qn=o("chevron-up",Le);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],Un=o("circle-alert",Ae);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ee=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Jn=o("circle-check",Ee);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],Zn=o("circle-check-big",Fe);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Kn=o("circle",Ve);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=[["path",{d:"M12 6v6l4 2",key:"mmk7yg"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],t1=o("clock",Xe);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Re=[["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193",key:"yfwify"}],["path",{d:"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07",key:"jlfiyv"}]],e1=o("cloud-off",Re);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Be=[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]],a1=o("cloud",Be);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ie=[["path",{d:"m18 16 4-4-4-4",key:"1inbqp"}],["path",{d:"m6 8-4 4 4 4",key:"15zrgr"}],["path",{d:"m14.5 4-5 16",key:"e7oirm"}]],n1=o("code-xml",Ie);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]],r1=o("credit-card",Ge);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]],o1=o("crown",Qe);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],c1=o("database",Ue);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Je=[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]],s1=o("dollar-sign",Je);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ze=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],i1=o("download",Ze);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]],d1=o("ellipsis-vertical",Ke);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ta=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]],h1=o("ellipsis",ta);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ea=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],u1=o("external-link",ea);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const aa=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],l1=o("eye-off",aa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],y1=o("eye",na);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ra=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],f1=o("file-text",ra);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oa=[["path",{d:"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",key:"1slcih"}]],m1=o("flame",oa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ca=[["path",{d:"M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z",key:"1fr9dc"}],["path",{d:"M8 10v4",key:"tgpxqk"}],["path",{d:"M12 10v2",key:"hh53o1"}],["path",{d:"M16 10v6",key:"1d6xys"}]],k1=o("folder-kanban",ca);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sa=[["path",{d:"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",key:"usdka0"}]],p1=o("folder-open",sa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=[["circle",{cx:"5",cy:"6",r:"3",key:"1qnov2"}],["path",{d:"M12 6h5a2 2 0 0 1 2 2v7",key:"1yj91y"}],["path",{d:"m15 9-3-3 3-3",key:"1lwv8l"}],["circle",{cx:"19",cy:"18",r:"3",key:"1qljk2"}],["path",{d:"M12 18H7a2 2 0 0 1-2-2V9",key:"16sdep"}],["path",{d:"m9 15 3 3-3 3",key:"1m3kbl"}]],g1=o("git-compare-arrows",ia);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=[["circle",{cx:"18",cy:"18",r:"3",key:"1xkwt0"}],["circle",{cx:"6",cy:"6",r:"3",key:"1lh9wr"}],["path",{d:"M6 21V9a9 9 0 0 0 9 9",key:"7kw0sc"}]],M1=o("git-merge",da);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=[["path",{d:"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",key:"tonef"}],["path",{d:"M9 18c-4.51 2-5-2-7-2",key:"9comsn"}]],w1=o("github",ha);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]],_1=o("graduation-cap",ua);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const la=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"M15 3v18",key:"14nvp0"}]],v1=o("grid-3x3",la);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]],x1=o("grip-vertical",ya);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=[["path",{d:"M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17",key:"geh8rc"}],["path",{d:"m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9",key:"1fto5m"}],["path",{d:"m2 16 6 6",key:"1pfhp9"}],["circle",{cx:"16",cy:"9",r:"2.9",key:"1n0dlu"}],["circle",{cx:"6",cy:"5",r:"3",key:"151irh"}]],b1=o("hand-coins",fa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=[["path",{d:"M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16",key:"1v1a37"}],["path",{d:"m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95",key:"fhfbnt"}],["path",{d:"m2 15 6 6",key:"10dquu"}],["path",{d:"m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91",key:"1x6kdw"}]],N1=o("hand-heart",ma);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ka=[["line",{x1:"22",x2:"2",y1:"12",y2:"12",key:"1y58io"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}],["line",{x1:"6",x2:"6.01",y1:"16",y2:"16",key:"sgf278"}],["line",{x1:"10",x2:"10.01",y1:"16",y2:"16",key:"1l4acy"}]],$1=o("hard-drive",ka);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"r6nss1"}]],D1=o("house",pa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ga=[["polyline",{points:"22 12 16 12 14 15 10 15 8 12 2 12",key:"o97t9d"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}]],P1=o("inbox",ga);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ma=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],O1=o("info",Ma);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=[["path",{d:"M10 18v-7",key:"wt116b"}],["path",{d:"M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z",key:"1m329m"}],["path",{d:"M14 18v-7",key:"vav6t3"}],["path",{d:"M18 18v-7",key:"aexdmj"}],["path",{d:"M3 22h18",key:"8prr45"}],["path",{d:"M6 18v-7",key:"1ivflk"}]],C1=o("landmark",wa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _a=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],S1=o("layout-dashboard",_a);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const va=[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]],H1=o("layout-grid",va);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]],q1=o("lightbulb",xa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ba=[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]],W1=o("link",ba);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Na=[["path",{d:"M13 5h8",key:"a7qcls"}],["path",{d:"M13 12h8",key:"h98zly"}],["path",{d:"M13 19h8",key:"c3s6r1"}],["path",{d:"m3 17 2 2 4-4",key:"1jhpwq"}],["rect",{x:"3",y:"4",width:"6",height:"6",rx:"1",key:"cif1o7"}]],T1=o("list-todo",Na);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $a=[["path",{d:"M3 5h.01",key:"18ugdj"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 19h.01",key:"noohij"}],["path",{d:"M8 5h13",key:"1pao27"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 19h13",key:"m83p4d"}]],z1=o("list",$a);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Da=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],j1=o("loader-circle",Da);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pa=[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]],Y1=o("log-in",Pa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oa=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],L1=o("log-out",Oa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],A1=o("lock",Ca);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sa=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],E1=o("map-pin",Sa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ha=[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]],F1=o("menu",Ha);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qa=[["path",{d:"M5 12h14",key:"1ays0h"}]],V1=o("minus",qa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wa=[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]],X1=o("moon",Wa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ta=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],R1=o("pen",Ta);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const za=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]],B1=o("pencil",za);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ja=[["path",{d:"M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z",key:"1piglc"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M2 8v1a2 2 0 0 0 2 2h1",key:"1env43"}]],I1=o("piggy-bank",ja);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ya=[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]],G1=o("play",Ya);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const La=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],Q1=o("plus",La);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Aa=[["path",{d:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z",key:"q3az6g"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 17.5v-11",key:"1jc1ny"}]],U1=o("receipt",Aa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ea=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],J1=o("refresh-cw",Ea);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fa=[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]],Z1=o("repeat",Fa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Va=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],K1=o("rotate-ccw",Va);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xa=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],tr=o("save",Xa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ra=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],er=o("search",Ra);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ba=[["path",{d:"M14 17H5",key:"gfn3mx"}],["path",{d:"M19 7h-9",key:"6i9tg"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]],ar=o("settings-2",Ba);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ia=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],nr=o("settings",Ia);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ga=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],rr=o("shield",Ga);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qa=[["path",{d:"M10 5H3",key:"1qgfaw"}],["path",{d:"M12 19H3",key:"yhmn1j"}],["path",{d:"M14 3v4",key:"1sua03"}],["path",{d:"M16 17v4",key:"1q0r14"}],["path",{d:"M21 12h-9",key:"1o4lsq"}],["path",{d:"M21 19h-5",key:"1rlt1p"}],["path",{d:"M21 5h-7",key:"1oszz2"}],["path",{d:"M8 10v4",key:"tgpxqk"}],["path",{d:"M8 12H3",key:"a7s4jb"}]],or=o("sliders-horizontal",Qa);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ua=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],cr=o("smartphone",Ua);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ja=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],sr=o("sparkles",Ja);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Za=[["path",{d:"M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344",key:"2acyp4"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],ir=o("square-check-big",Za);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ka=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],dr=o("square-pen",Ka);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tn=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]],hr=o("square",tn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const en=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]],ur=o("star",en);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const an=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],lr=o("sun",an);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nn=[["path",{d:"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",key:"vktsd0"}],["circle",{cx:"7.5",cy:"7.5",r:".5",fill:"currentColor",key:"kqv944"}]],yr=o("tag",nn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rn=[["path",{d:"M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z",key:"16rjxf"}],["path",{d:"M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193",key:"178nd4"}],["circle",{cx:"10.5",cy:"6.5",r:".5",fill:"currentColor",key:"12ikhr"}]],fr=o("tags",rn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const on=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],mr=o("target",on);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cn=[["line",{x1:"10",x2:"14",y1:"2",y2:"2",key:"14vaq8"}],["line",{x1:"12",x2:"15",y1:"14",y2:"11",key:"17fdiu"}],["circle",{cx:"12",cy:"14",r:"8",key:"1e1u0o"}]],kr=o("timer",cn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sn=[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],pr=o("trash-2",sn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dn=[["path",{d:"M16 17h6v-6",key:"t6n2it"}],["path",{d:"m22 17-8.5-8.5-5 5L2 7",key:"x473p"}]],gr=o("trending-down",dn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hn=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],Mr=o("trending-up",hn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const un=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],wr=o("triangle-alert",un);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ln=[["path",{d:"M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978",key:"1n3hpd"}],["path",{d:"M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978",key:"rfe1zi"}],["path",{d:"M18 9h1.5a1 1 0 0 0 0-5H18",key:"7xy6bh"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z",key:"1mhfuq"}],["path",{d:"M6 9H4.5a1 1 0 0 1 0-5H6",key:"tex48p"}]],_r=o("trophy",ln);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yn=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],vr=o("upload",yn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fn=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],xr=o("users",fn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mn=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],br=o("user",mn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kn=[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",key:"18etb6"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",key:"xoc0q4"}]],Nr=o("wallet",kn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pn=[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",key:"1ngwbx"}]],$r=o("wrench",pn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gn=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],Dr=o("x",gn);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mn=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],Pr=o("zap",Mn);export{_r as $,On as A,qn as B,r1 as C,c1 as D,d1 as E,f1 as F,_1 as G,$1 as H,Un as I,H1 as J,_n as K,j1 as L,E1 as M,zn as N,Mr as O,Q1 as P,k1 as Q,K1 as R,nr as S,mr as T,vr as U,hr as V,ir as W,Dr as X,D1 as Y,Pr as Z,m1 as _,Jn as a,Tn as a0,P1 as a1,er as a2,yr as a3,ar as a4,x1 as a5,Gn as a6,G1 as a7,w1 as a8,Yn as a9,q1 as aA,Sn as aB,Dn as aC,A1 as aD,Ln as aE,An as aF,l1 as aG,xr as aH,or as aI,h1 as aJ,Nn as aK,jn as aL,I1 as aM,fr as aN,xn as aO,bn as aP,lr as aQ,X1 as aR,L1 as aS,vn as aT,S1 as aU,p1 as aV,Y1 as aW,F1 as aX,Zn as aY,M1 as aZ,kr as aa,sr as ab,V1 as ac,$n as ad,R1 as ae,Z1 as af,Nr as ag,U1 as ah,B1 as ai,O1 as aj,b1 as ak,rr as al,cr as am,Cn as an,gr as ao,n1 as ap,$r as aq,y1 as ar,Xn as as,o1 as at,Fn as au,In as av,Pn as aw,g1 as ax,C1 as ay,ur as az,Bn as b,Rn as c,Qn as d,pr as e,wr as f,i1 as g,a1 as h,e1 as i,J1 as j,tr as k,En as l,t1 as m,N1 as n,W1 as o,Vn as p,dr as q,br as r,T1 as s,Kn as t,Wn as u,Hn as v,v1 as w,z1 as x,u1 as y,s1 as z};
