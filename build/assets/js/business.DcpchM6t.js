const o=async({type:e,options:n})=>{e&&chrome.runtime.sendMessage({type:e,options:n},function(s){console.log("------>response",s)})};o.rebuild="rebuild";export{o as S};
