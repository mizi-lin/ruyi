let a="",s=0;document.body.addEventListener("keydown",o=>{const t=o.key.toLowerCase(),n=new Date().getTime(),e=document.activeElement;e&&(e.tagName.toUpperCase()==="INPUT"||e.tagName.toUpperCase()==="TEXTAREA"||e.isContentEditable)||(t==="r"&&a==="r"&&n-s<1e3&&chrome.runtime.sendMessage({type:"openApp"}),t==="y"&&a==="y"&&n-s<1e3&&chrome.runtime.sendMessage({type:"openSearchEngines"}),a=t,s=n)});
