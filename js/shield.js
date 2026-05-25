/* LW Inventory Shield – generiert, nicht manuell bearbeiten */
(function(g){var P={"s":"01yhgRrx0GqkylicrToPCw==","i":"lxbmzQSHMFnoz3sT","t":"QMk95pA9SDwEJgB5HPI8tQ==","c":"WzDpBCztwtlGSjcvCB+c/EWRWUiHWThf/Vx6ClMQBuXqKY993G5NGEwZ+OdR4ZBDxcJCqqSvLrGtX2897XAHtBXexTt3zO+kgu91G09KIIoLBYg+Xy916wjxPhnJEnynWA8S5giCya7kRLgunCxnow==","h":"0ba567fd734804ce369218772b06fe8817173ecf3404fb2705bfcd0aef012a33","p":"QUtmeWNid2N3VlpDaDgxMnFUcW5PU0tYaVpodXJHMkM1YVJlNHFNclJRam4xeXZHMDRjRGQyZlhsSHlpX0hqSjdtT2wzMzVx"};
function b64d(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
g.LW_SHIELD={
  configured:true,
  cfg:function(){return{loginHash:P.h,apiUrl:null};},
  publicApiUrl:function(){return'https://script.google.com/macros/s/'+atob(P.p)+'/exec';},
  unlock:async function(pw){
    var enc=new TextEncoder();
    var km=await g.crypto.subtle.importKey('raw',enc.encode(pw),{name:'PBKDF2'},false,['deriveKey']);
    var dk=await g.crypto.subtle.deriveKey({name:'PBKDF2',salt:b64d(P.s),iterations:120000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
    var ct=b64d(P.c),tg=b64d(P.t),buf=new Uint8Array(ct.length+tg.length);
    buf.set(ct,0);buf.set(tg,ct.length);
    var pt=await g.crypto.subtle.decrypt({name:'AES-GCM',iv:b64d(P.i),tagLength:128},dk,buf);
    return new TextDecoder().decode(pt);
  }
};})(typeof window!=='undefined'?window:global);
