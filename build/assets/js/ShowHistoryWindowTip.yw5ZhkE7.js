import{r as c,j as g}from"./jsx-runtime.YiCzgiTN.js";import{w as I}from"./index.BmLTv-v0.js";import{S as E}from"./index.Ccof6RHb.js";import{i as P}from"./index.Bog7QPHP.js";import{r as B,b as s,C as W,d as H}from"./app.DipYMi2s.js";import{g as T,m as N}from"./index.CLukP_Oa.js";import"../../src/pages/app/index.js";import"./constants.Dc8TDCOl.js";import"./index.CrDBv-OJ.js";import"./store.H8fUv9eA.js";import"./BlockOutlined.D5zbdCn2.js";import"./HolderOutlined.Bg9Lv9wM.js";const k=t=>{const{componentCls:e,sizePaddingEdgeHorizontal:l,colorSplit:r,lineWidth:i,textPaddingInline:d,orientationMargin:o,verticalMarginInline:a}=t;return{[e]:Object.assign(Object.assign({},B(t)),{borderBlockStart:`${s(i)} solid ${r}`,"&-vertical":{position:"relative",top:"-0.06em",display:"inline-block",height:"0.9em",marginInline:a,marginBlock:0,verticalAlign:"middle",borderTop:0,borderInlineStart:`${s(i)} solid ${r}`},"&-horizontal":{display:"flex",clear:"both",width:"100%",minWidth:"100%",margin:`${s(t.dividerHorizontalGutterMargin)} 0`},[`&-horizontal${e}-with-text`]:{display:"flex",alignItems:"center",margin:`${s(t.dividerHorizontalWithTextGutterMargin)} 0`,color:t.colorTextHeading,fontWeight:500,fontSize:t.fontSizeLG,whiteSpace:"nowrap",textAlign:"center",borderBlockStart:`0 ${r}`,"&::before, &::after":{position:"relative",width:"50%",borderBlockStart:`${s(i)} solid transparent`,borderBlockStartColor:"inherit",borderBlockEnd:0,transform:"translateY(50%)",content:"''"}},[`&-horizontal${e}-with-text-left`]:{"&::before":{width:`calc(${o} * 100%)`},"&::after":{width:`calc(100% - ${o} * 100%)`}},[`&-horizontal${e}-with-text-right`]:{"&::before":{width:`calc(100% - ${o} * 100%)`},"&::after":{width:`calc(${o} * 100%)`}},[`${e}-inner-text`]:{display:"inline-block",paddingBlock:0,paddingInline:d},"&-dashed":{background:"none",borderColor:r,borderStyle:"dashed",borderWidth:`${s(i)} 0 0`},[`&-horizontal${e}-with-text${e}-dashed`]:{"&::before, &::after":{borderStyle:"dashed none none"}},[`&-vertical${e}-dashed`]:{borderInlineStartWidth:i,borderInlineEnd:0,borderBlockStart:0,borderBlockEnd:0},[`&-plain${e}-with-text`]:{color:t.colorText,fontWeight:"normal",fontSize:t.fontSize},[`&-horizontal${e}-with-text-left${e}-no-default-orientation-margin-left`]:{"&::before":{width:0},"&::after":{width:"100%"},[`${e}-inner-text`]:{paddingInlineStart:l}},[`&-horizontal${e}-with-text-right${e}-no-default-orientation-margin-right`]:{"&::before":{width:"100%"},"&::after":{width:0},[`${e}-inner-text`]:{paddingInlineEnd:l}}})}},G=t=>({textPaddingInline:"1em",orientationMargin:.05,verticalMarginInline:t.marginXS}),D=T("Divider",t=>{const e=N(t,{dividerHorizontalWithTextGutterMargin:t.margin,dividerHorizontalGutterMargin:t.marginLG,sizePaddingEdgeHorizontal:0});return[k(e)]},G,{unitless:{orientationMargin:!0}});var L=function(t,e){var l={};for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&e.indexOf(r)<0&&(l[r]=t[r]);if(t!=null&&typeof Object.getOwnPropertySymbols=="function")for(var i=0,r=Object.getOwnPropertySymbols(t);i<r.length;i++)e.indexOf(r[i])<0&&Object.prototype.propertyIsEnumerable.call(t,r[i])&&(l[r[i]]=t[r[i]]);return l};const R=t=>{const{getPrefixCls:e,direction:l,divider:r}=c.useContext(W),{prefixCls:i,type:d="horizontal",orientation:o="center",orientationMargin:a,className:x,rootClassName:$,children:h,dashed:u,plain:S,style:w}=t,y=L(t,["prefixCls","type","orientation","orientationMargin","className","rootClassName","children","dashed","plain","style"]),n=e("divider",i),[v,z,C]=D(n),O=o.length>0?`-${o}`:o,m=!!h,f=o==="left"&&a!=null,p=o==="right"&&a!=null,j=H(n,r==null?void 0:r.className,z,C,`${n}-${d}`,{[`${n}-with-text`]:m,[`${n}-with-text${O}`]:m,[`${n}-dashed`]:!!u,[`${n}-plain`]:!!S,[`${n}-rtl`]:l==="rtl",[`${n}-no-default-orientation-margin-left`]:f,[`${n}-no-default-orientation-margin-right`]:p},x,$),b=c.useMemo(()=>typeof a=="number"?a:/^\d+$/.test(a)?Number(a):a,[a]),M=Object.assign(Object.assign({},f&&{marginLeft:b}),p&&{marginRight:b});return v(c.createElement("div",Object.assign({className:j,style:Object.assign(Object.assign({},r==null?void 0:r.style),w)},y,{role:"separator"}),h&&d!=="vertical"&&c.createElement("span",{className:`${n}-inner-text`,style:M},h)))},tt=()=>{const t=P(I(E.TabsShowHistoryWindows));return g.jsx(g.Fragment,{children:(t==null?void 0:t.contents)&&g.jsx(R,{children:g.jsx("span",{style:{fontSize:14,fontWeight:200,color:"#999"},children:"只保存三个月内或近30个历史窗口"})})})};export{tt as default};
