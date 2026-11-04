const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/qz-tray-BZ5t4W_r.js","assets/vendor-ui-5KT8s7R4.js","assets/vendor-vue-Q253QS5I.js","assets/vendor-ui-DcOjezQk.css"])))=>i.map(i=>d[i]);
var ct=Object.defineProperty,mt=Object.defineProperties;var ft=Object.getOwnPropertyDescriptors;var V=Object.getOwnPropertySymbols;var ut=Object.prototype.hasOwnProperty,gt=Object.prototype.propertyIsEnumerable;var Y=(t,e,n)=>e in t?ct(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n,K=(t,e)=>{for(var n in e||(e={}))ut.call(e,n)&&Y(t,n,e[n]);if(V)for(var n of V(e))gt.call(e,n)&&Y(t,n,e[n]);return t},X=(t,e)=>mt(t,ft(e));var u=(t,e,n)=>new Promise((s,o)=>{var r=l=>{try{d(n.next(l))}catch(i){o(i)}},a=l=>{try{d(n.throw(l))}catch(i){o(i)}},d=l=>l.done?s(l.value):Promise.resolve(l.value).then(r,a);d((n=n.apply(t,e)).next())});import{l as st,a as C,W as yt,X as xt,s as Q,Y as J,A as bt,d as ht,e as _t,g as wt}from"./index-CMt13MhL.js";import{_ as $t}from"./vendor-ui-5KT8s7R4.js";import{v as B}from"./vendor-vue-Q253QS5I.js";function Ct(t){return t==null?"0.00":Number.parseFloat(t).toFixed(2)}function St(t){if(t==null)return"0";const e=Number.parseFloat(t);return Number.isNaN(e)?"0":e.toFixed(4).replace(/\.?0+$/,"")}function zt(t){return t?new Date(t).toLocaleString():""}function Tt(t){if(!t)return"";if(typeof t=="string"&&t.includes(":")){const e=t.split(":");if(e.length>=2){const n=Number.parseInt(e[0],10),s=e[1];if(Number.isNaN(n))return t;const o=n>=12?"PM":"AM";return`${n%12||12}:${s} ${o}`}return t}return new Date(t).toLocaleTimeString([],{hour:"numeric",minute:"2-digit",hour12:!0})}function At(t){if(!t)return"";if(typeof t=="string"){const e=t.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(e){const[,n,s,o]=e;return`${o}/${s}/${n.slice(-2)}`}}return new Date(t).toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"2-digit"})}function It(t,e=2){return t==null?"0%":`${Number.parseFloat(t).toFixed(e).replace(/\.?0+$/,"")}%`}function qt(){return{formatCurrency:Ct,formatQuantity:St,formatDateTime:zt,formatTime:Tt,formatDate:At,formatPercentage:It}}const y=st.create("QZTray");let T=null;function q(){return u(this,null,function*(){if(!T){const t=yield $t(()=>import("./qz-tray-BZ5t4W_r.js").then(e=>e.q),__vite__mapDeps([0,1,2,3]));T=t.default||t}return T})}const A=B(!1),M=B(!1),j=B("unknown"),ot="pos_qz_printer_name";function Nt(){try{return localStorage.getItem(ot)||""}catch(t){return""}}function Ht(t){try{localStorage.setItem(ot,t||"")}catch(e){y.warn("Failed to save printer name to localStorage:",e)}}let D=!1,L=null,P=!1;function Ft(t){D||(D=!0,t.security.setCertificatePromise((e,n)=>{if(L){P=!0,e(L);return}C("pos_next.api.qz.get_certificate").then(s=>{const o=(s==null?void 0:s.message)||s;o?(L=o,P=!0):(P=!1,j.value="untrusted"),e(o)}).catch(s=>{y.warn("Could not fetch QZ certificate:",(s==null?void 0:s.message)||s),P=!1,j.value="untrusted",e()})}),t.security.setSignatureAlgorithm("SHA512"),t.security.setSignaturePromise(e=>(n,s)=>{C("pos_next.api.qz.sign_message",{message:e}).then(o=>{const r=(o==null?void 0:o.message)||o;r&&P&&(j.value="trusted"),n(r)}).catch(o=>{y.warn("Could not sign QZ message:",(o==null?void 0:o.message)||o),j.value="untrusted",n()})}))}let O=null;function rt(){return u(this,null,function*(){const t=yield q();if(t.websocket.isActive())return A.value=!0,!0;if(O)return O;O=Pt(t);try{return yield O}finally{O=null}})}function Pt(t){return u(this,null,function*(){Ft(t),t.websocket.setClosedCallbacks(()=>{y.info("QZ Tray connection closed"),A.value=!1,M.value=!1,j.value="unknown"}),M.value=!0;try{return yield t.websocket.connect(),A.value=!0,y.info("Connected to QZ Tray"),t.printers.find().catch(()=>{}),!0}catch(e){return A.value=!1,y.warn("Could not connect to QZ Tray:",(e==null?void 0:e.message)||e),!1}finally{M.value=!1}})}function Gt(){return u(this,null,function*(){if(!T||!T.websocket.isActive()){A.value=!1;return}try{yield T.websocket.disconnect()}catch(t){y.warn("Error disconnecting from QZ Tray:",(t==null?void 0:t.message)||t)}finally{A.value=!1}})}function Zt(){return u(this,null,function*(){const t=yield q();if(!t.websocket.isActive()&&!(yield rt()))return[];try{const e=yield t.printers.find();return y.info(`Found ${e.length} printer(s)`),e}catch(e){return y.error("Error discovering printers:",(e==null?void 0:e.message)||e),[]}})}function at(s,o){return u(this,arguments,function*(t,e,n={}){const r=yield q();if(!r.websocket.isActive()&&!(yield rt()))throw new Error("QZ Tray is not available");const a=Nt();if(!a)throw new Error("No printer selected. Please select a printer in POS Settings.");const d=r.configs.create(a,{size:{width:n.width||80,height:null},units:"mm",orientation:n.orientation||"portrait",margins:{top:0,right:0,bottom:0,left:0},colorType:"grayscale",interpolation:"nearest-neighbor"}),l=[{type:"pixel",format:"html",flavor:"plain",data:t}];try{return yield r.print(d,l),y.info(`Print job sent to "${a}"`),!0}catch(i){throw y.error(`Print failed on "${a}":`,(i==null?void 0:i.message)||i),i}})}const x=st.create("PrintInvoice"),tt="MDX POS Receipt";function it(t={}){var r,a,d,l;let e=null;try{const i=_t();i&&(e=i)}catch(i){}const n=t.receipt_header_title||(e==null?void 0:e.receiptHeaderTitle)||"Recibo de Venta",s=!!((a=(r=t.enable_siat_fiscal_format)!=null?r:e==null?void 0:e.enableSiatFiscalFormat)!=null&&a),o=!!((l=(d=t.enable_whatsapp_send)!=null?d:e==null?void 0:e.enableWhatsappSend)==null||l);return{headerTitle:n,isFiscal:s,enableWhatsappSend:o}}function c(t){return Number.parseFloat(t||0).toFixed(2)}function Ot(t){if(!t)return"0";const e=t.match(/-(\d+)$/);return e?parseInt(e[1],10):t}function jt(t){if(t.cuf)return t.cuf;const e=t.name||"MOCK";let n="";for(let s=0;s<64;s++){const o=(e.charCodeAt(s%e.length)+s*17)%16;n+=o.toString(16).toUpperCase()}return n}function vt(t){const e=Math.floor(t),n=Math.round((t-e)*100),s=String(n).padStart(2,"0")+"/100 Bolivianos";if(e===0)return"Cero "+s;const o=["","Uno","Dos","Tres","Cuatro","Cinco","Seis","Siete","Ocho","Nueve"],r=["","Diez","Veinte","Treinta","Cuarenta","Cincuenta","Sesenta","Setenta","Ochenta","Noventa"],a=["Diez","Once","Doce","Trece","Catorce","Quince","Dieciséis","Diecisiete","Dieciocho","Diecinueve"],d=["","Ciento","Doscientos","Trescientos","Cuatrocientos","Quinientos","Seiscientos","Setecientos","Ochocientos","Novecientos"];function l(I){let g="";const p=Math.floor(I/100),m=Math.floor(I%100/10),f=I%10;return p>0&&(p===1&&m===0&&f===0?g+="Cien ":g+=d[p]+" "),m===1?g+=a[f]+" ":m>1?g+=r[m]+(f>0?" y "+o[f]:"")+" ":f>0&&(f===1?g+="Un ":g+=o[f]+" "),g}let i="";const b=Math.floor(e/1e6),S=Math.floor(e%1e6/1e3),v=e%1e3;return b>0&&(i+=b===1?"Un Millón ":l(b)+"Millones "),S>0&&(i+=S===1?"Mil ":l(S)+"Mil "),v>0&&(i+=l(v)),i=i.trim().replace(/\s+/g," "),i=i.charAt(0).toUpperCase()+i.slice(1),i==="Un"&&(i="Uno"),"Son: "+i+" "+s}function Et(t){return t.paid_amount!=null?t.paid_amount:Array.isArray(t.payments)?t.payments.reduce((e,n)=>e+(Number.parseFloat(n.amount)||0),0):0}function H(t){return typeof t=="string"&&(t.startsWith("OFFLINE-")||t.startsWith("pos_offline_"))}function pt(t){H(t)&&ht.markOfflineInvoicePrinted(t).catch(e=>{x.warn("Failed to mark offline invoice printed:",(e==null?void 0:e.message)||e)})}function Rt(t,e){const n=Array.isArray(e.items)?e.items:[],s=Array.isArray(e.payments)?e.payments:[],o=Number.parseFloat(e.grand_total)||0,r=s.reduce((a,d)=>a+(Number.parseFloat(d.amount)||0),0);return{name:t,doctype:"Sales Invoice",is_offline:!0,pos_profile:e.pos_profile,posting_date:e.posting_date||new Date().toISOString().slice(0,10),company:e.company,customer_name:e.customer,items:n.map(a=>{var d;return X(K({},a),{quantity:(d=a.quantity)!=null?d:a.qty})}),grand_total:o,total_taxes_and_charges:Number.parseFloat(e.total_tax)||0,discount_amount:Number.parseFloat(e.total_discount)||0,payments:s,paid_amount:r,change_amount:Number.parseFloat(e.change_amount)||0,outstanding_amount:Math.max(0,o-r),status:o-r<.01?"Paid":"Unpaid",docstatus:0}}function G(t){return u(this,null,function*(){var n,s,o;if(!(t!=null&&t.name)||!H(t.name)||((n=t.items)==null?void 0:n.length)>0)return t;const e=yt(t.name);if(((s=e==null?void 0:e.items)==null?void 0:s.length)>0)return e;try{const r=yield xt(t.name);if(((o=r==null?void 0:r.items)==null?void 0:o.length)>0)return Rt(t.name,r)}catch(r){x.warn("IndexedDB hydrate fallback failed:",(r==null?void 0:r.message)||r)}return t})}const U={},W={};function R(t){return u(this,null,function*(){var s;if(!t)return t;const e=t.company;if(e)if(W[e]){const o=W[e];t.company_phone=o.phone,t.company_address=o.address,t.company_city=o.city}else try{const o=yield C("frappe.client.get_value",{doctype:"Address",filters:{is_your_company_address:1},fieldname:["phone","address_line1","city"]}),r=(o==null?void 0:o.message)||o;if(r){const a={phone:r.phone||"",address:r.address_line1||"",city:r.city||""};W[e]=a,t.company_phone=a.phone,t.company_address=a.address,t.company_city=a.city}}catch(o){x.warn("Failed to fetch company address details:",o)}const n=t.owner||Q.user;if(n)if(n===J.userId||n===Q.user)t.owner_name=J.getDisplayName();else if(U[n])t.owner_name=U[n];else try{const o=yield C("frappe.client.get_value",{doctype:"User",filters:{name:n},fieldname:"full_name"}),r=((s=o==null?void 0:o.message)==null?void 0:s.full_name)||(o==null?void 0:o.full_name);r?(U[n]=r,t.owner_name=r):t.owner_name=n.split("@")[0].toUpperCase()}catch(o){x.warn("Failed to fetch full_name for owner:",o),t.owner_name=n.split("@")[0].toUpperCase()}if(Array.isArray(t.items))try{const o=t.items.map(r=>u(this,null,function*(){if(!r.custom_medida&&r.item_code){const a=yield bt.items.get(r.item_code);a&&a.custom_medida&&(r.custom_medida=a.custom_medida)}}));yield Promise.all(o)}catch(o){x.warn("Failed to hydrate items with custom_medida from IndexedDB:",o)}return t})}const kt=`
	* { margin: 0; padding: 0; box-sizing: border-box; }
	body {
		font-family: 'Courier New', monospace;
		padding: 10px; width: 80mm; margin: 0; max-width: 80mm;
		font-weight: bold; color: black;
	}
	.receipt { width: 100%; }
	.header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
	.company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
	.invoice-info { margin-bottom: 15px; font-size: 12px; }
	.invoice-info div { display: flex; justify-content: space-between; margin-bottom: 3px; }
	.partial-status { color: #000; font-weight: bold; margin-bottom: 5px; }
	.items-table { width: 100%; margin-bottom: 15px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
	.item-row { margin-bottom: 10px; font-size: 12px; }
	.item-name { font-weight: bold; margin-bottom: 3px; }
	.item-details { display: flex; justify-content: space-between; font-size: 11px; }
	.item-discount { display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px; }
	.item-serials { font-size: 9px; margin-top: 3px; padding: 3px 5px; border: 1px dashed #000; border-radius: 2px; }
	.item-serials-label { font-weight: bold; margin-bottom: 2px; }
	.item-serials-list { word-break: break-all; }
	.totals { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
	.total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
	.grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
	.payments { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
	.payment-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
	.total-paid { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
	.outstanding-row {
		display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;
		border: 1px solid #000; padding: 8px; margin-top: 8px; border-radius: 4px;
	}
	.offline-badge {
		text-align: center; font-size: 11px; font-weight: bold;
		border: 1px dashed #000; padding: 4px; margin-bottom: 10px;
	}
	.footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 2px dashed #000; font-size: 11px; }
	@media print {
		@page { margin: 0; }
		body { width: 80mm; padding: 5mm; margin: 0; }
		.no-print { display: none; }
	}
`;function Mt(t){const e=t.doctype==="Quotation"||t.header==="Quotation"||t.name&&(t.name.startsWith("QTN-")||t.name.startsWith("COT-")),n=t.doctype==="Sales Order"||t.header==="Draft"||t.name&&(t.name.startsWith("SAL-ORD-")||t.name.startsWith("PRE-")),s=!e&&!n,o=wt(t.currency||"BOB"),r=t.owner||Q.user||"Administrator",a=t.owner_name||r.split("@")[0].toUpperCase();function d(p){const m=new Date(p||Date.now()),f=String(m.getDate()).padStart(2,"0"),h=String(m.getMonth()+1).padStart(2,"0"),$=m.getFullYear(),_=String(m.getHours()).padStart(2,"0"),w=String(m.getMinutes()).padStart(2,"0");return`${f}/${h}/${$} ${_}:${w}`}const l=t.items||[],i=Et(t),b=l.map(p=>{const m=p.discount_percentage&&Number.parseFloat(p.discount_percentage)>0||p.discount_amount&&Number.parseFloat(p.discount_amount)>0,f=p.is_free_item,h=p.quantity||p.qty||0,$=p.price_list_rate||p.rate||0,_=h*$;if(!s){const z=h!==1?`x${h}`:"",N=p.custom_medida||p.medida||"",E=N?`(${N})`:"",k=m?`[Desc: -${c(p.discount_amount||0)}]`:"";return`
						<div class="item-row" style="margin-bottom: 4px; font-size: 11px; color: black; font-weight: bold;">
							<div style="display: flex; justify-content: space-between; align-items: baseline;">
								<span style="word-break: break-word; padding-right: 8px;">${[p.item_code,E,z,k].filter(Boolean).join(" ")}</span>
								<span style="white-space: nowrap;">${c(_)}</span>
							</div>
						</div>`}const w=p.custom_medida||p.medida||"";return`
						<div class="item-row" style="margin-bottom: 8px; font-size: 11px;">
							<div class="item-name" style="font-weight: bold;">
								${p.item_code} - ${p.item_name} ${f?__("(GRATIS)"):""}
								${w?`<div style="font-size: 9px; color: #555; font-weight: normal; margin-top: 1px;">Medida: ${w}</div>`:""}
							</div>
							<div class="item-details" style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px;">
								<span>${h} × ${c($)}</span>
								<span><strong>${c(_)}</strong></span>
							</div>
							${m?`<div class="item-discount" style="display: flex; justify-content: space-between; font-size: 9px; color: #28a745; margin-top: 1px;">
											<span>Descuento (${Number(p.discount_percentage).toFixed(1)}%)</span>
											<span>-${c(p.discount_amount||0)}</span>
									   </div>`:""}
						</div>`}).join(""),{headerTitle:S,isFiscal:v}=it(t),I=e?__("Cotización #:"):n?__("Pre-venta #:"):`${S} #:`,g=e?__("COTIZACIÓN"):n?__("PRE-VENTA"):S.toUpperCase();if(s){const p=Ot(t.name),m=(t.customer_name||t.customer||"CLIENTE GENERAL").toUpperCase(),f=t.tax_id||t.customer_tax_id||"",h=vt(t.grand_total),$=t.company||"",_=t.company_address||"",w=t.company_phone||"",z=t.company_city||"";if(!v)return`
			<div class="receipt" style="font-family: monospace, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000;">
				<div class="header" style="text-align: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px dashed #000;">
					<div class="company-name" style="font-size: 16px; font-weight: bold; margin-bottom: 2px;">${$}</div>
					${_?`<div style="font-size: 9.5px; font-weight: normal; margin-bottom: 1px;">${_}</div>`:""}
					${w?`<div style="font-size: 9.5px; font-weight: normal; margin-bottom: 1px;">Tel: ${w}</div>`:""}
					${z?`<div style="font-size: 9.5px; font-weight: normal; margin-bottom: 2px;">${z}</div>`:""}
					<div style="font-size: 13px; font-weight: bold; letter-spacing: 0.5px; margin-top: 6px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0;">
						${g}
					</div>
				</div>

				<div class="invoice-info" style="font-size: 10.5px; margin-bottom: 8px; line-height: 1.4; border-bottom: 1px dashed #000; padding-bottom: 6px;">
					<div style="display: flex; justify-content: space-between;"><span><strong>N° Venta:</strong></span><span>${p}</span></div>
					<div style="display: flex; justify-content: space-between;"><span><strong>Fecha:</strong></span><span>${d(t.posting_date||t.creation)}</span></div>
					<div style="display: flex; justify-content: space-between;"><span><strong>Cliente:</strong></span><span>${m}</span></div>
					${f&&f!=="0"?`<div style="display: flex; justify-content: space-between;"><span><strong>NIT / CI:</strong></span><span>${f}</span></div>`:""}
					${a?`<div style="display: flex; justify-content: space-between;"><span><strong>Vendedor:</strong></span><span>${a}</span></div>`:""}
				</div>

				<div class="items-table">
					${b}
				</div>

				<div class="totals" style="margin-top: 8px; border-top: 1px dashed #000; padding-top: 6px;">
					${t.discount_amount?`
					<div class="total-row" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #28a745;"><span>${__("Descuento Adicional")}${t.additional_discount_percentage?` (${Number(t.additional_discount_percentage).toFixed(1)}%)`:""}:</span><span>-${c(Math.abs(t.discount_amount))}</span></div>`:""}
					<div class="total-row grand-total" style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 6px; margin-top: 4px;">
						<span>${__("TOTAL A PAGAR {0}:",[o])}</span><span>${c(t.grand_total)}</span>
					</div>
				</div>

				<div style="font-size: 9.5px; font-style: italic; margin-top: 6px; line-height: 1.3; font-weight: normal; text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px;">
					${h}
				</div>

				${t.payments&&t.payments.length>0?`
				<div class="payments" style="margin-top: 8px; padding-bottom: 6px; border-bottom: 1px dashed #000;">
					<div style="font-weight: bold; margin-bottom: 4px; font-size: 11px;">${__("Detalle Pagos:")}</div>
					${t.payments.map(F=>`<div class="payment-row" style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px;"><span>${F.mode_of_payment}:</span><span>${c(F.amount)}</span></div>`).join("")}
					<div class="payment-row total-paid" style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; font-size: 10.5px;"><span>${__("Total Pagado:")}</span><span>${c(i)}</span></div>
					${t.change_amount&&t.change_amount>0?`<div class="payment-row" style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px; font-size: 10.5px;"><span>${__("Cambio:")}</span><span>${c(t.change_amount)}</span></div>`:""}
				</div>`:""}

				<div class="footer" style="text-align: center; font-size: 10.5px; font-weight: bold; line-height: 1.4; margin-top: 14px; padding-top: 4px; color: #111;">
					<div>${t.footer||__("¡GRACIAS POR SU COMPRA!")}</div>
				</div>
			</div>`;const N=jt(t),E=t.company_tax_id||t.company_nit||"102384729023",k=`https://siat.impuestos.gob.bo/consulta/QR?nit=${E}&cuf=${N}&numero=${p}&fecha=${t.posting_date||new Date().toISOString().slice(0,10)}&monto=${c(t.grand_total)}`,Z=`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(k)}`;return`
			<div class="receipt">
				<div class="header" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px;">
					<div class="company-name" style="font-size: 16px; font-weight: bold; margin-bottom: 2px;">${$}</div>
					<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">CASA MATRIZ</div>
					${_?`<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">${_}</div>`:""}
					${w?`<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">Teléfono: ${w}</div>`:""}
					${z?`<div style="font-size: 9px; font-weight: normal; margin-bottom: 2px;">${z}</div>`:""}
					<div style="font-size: 13px; font-weight: bold; letter-spacing: 0.5px; margin-top: 8px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0;">
						${g}
					</div>
				</div>

				<div class="tributary-panel" style="font-size: 10px; margin: 10px 0; border: 1px solid #000; padding: 6px; border-radius: 4px; line-height: 1.4; font-family: monospace;">
					<div><strong>NIT EMISOR:</strong> ${E}</div>
					<div><strong>NRO. FACTURA:</strong> ${p}</div>
					<div><strong>NRO. AUTORIZACIÓN (CUF):</strong></div>
					<div style="font-size: 7.5px; word-break: break-all; margin-top: 2px; line-height: 1.1; font-weight: normal;">${N}</div>
				</div>

				<div class="invoice-info" style="font-size: 10.5px; margin-bottom: 10px; line-height: 1.4; border-bottom: 1px dashed #000; padding-bottom: 8px;">
					<div style="display: flex; justify-content: space-between;"><span><strong>Fecha:</strong></span><span>${new Date(t.posting_date||Date.now()).toLocaleDateString()}</span></div>
					<div style="display: flex; justify-content: space-between;"><span><strong>Nombre/Razón Social:</strong></span><span>${m}</span></div>
					<div style="display: flex; justify-content: space-between;"><span><strong>NIT/CI:</strong></span><span>${f||"0"}</span></div>
					${a?`<div style="display: flex; justify-content: space-between;"><span><strong>Vendedor:</strong></span><span>${a}</span></div>`:""}
				</div>

				<div class="items-table">
					${b}
				</div>

				<div class="totals" style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px;">
					${t.total_taxes_and_charges&&t.total_taxes_and_charges>0?`
					<div class="total-row" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;"><span>${__("Subtotal:")}</span><span>${c((t.grand_total||0)-(t.total_taxes_and_charges||0))}</span></div>
					<div class="total-row" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;"><span>${__("IVA 13%:")}</span><span>${c(t.total_taxes_and_charges)}</span></div>`:""}
					${t.discount_amount?`
					<div class="total-row" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #28a745;"><span>${__("Descuento Adicional")}${t.additional_discount_percentage?` (${Number(t.additional_discount_percentage).toFixed(1)}%)`:""}:</span><span>-${c(Math.abs(t.discount_amount))}</span></div>`:""}
					<div class="total-row grand-total" style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 6px; margin-top: 6px;">
						<span>${__("TOTAL A PAGAR {0}:",[o])}</span><span>${c(t.grand_total)}</span>
					</div>
					<div class="total-row" style="display: flex; justify-content: space-between; font-size: 10.5px; margin-top: 4px; font-weight: normal;">
						<span>${__("Importe Base Crédito Fiscal:")}</span><span>${c(t.grand_total)}</span>
					</div>
				</div>

				<div style="font-size: 9.5px; font-style: italic; margin-top: 8px; line-height: 1.3; font-weight: normal; text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px;">
					${h}
				</div>

				${t.payments&&t.payments.length>0?`
				<div class="payments" style="margin-top: 10px; padding-bottom: 8px; border-bottom: 1px dashed #000;">
					<div style="font-weight: bold; margin-bottom: 4px; font-size: 11px;">${__("Detalle Pagos:")}</div>
					${t.payments.map(F=>`<div class="payment-row" style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px;"><span>${F.mode_of_payment}:</span><span>${c(F.amount)}</span></div>`).join("")}
					<div class="payment-row total-paid" style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; font-size: 10.5px;"><span>${__("Total Pagado:")}</span><span>${c(i)}</span></div>
					${t.change_amount&&t.change_amount>0?`<div class="payment-row" style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px; font-size: 10.5px;"><span>${__("Cambio:")}</span><span>${c(t.change_amount)}</span></div>`:""}
				</div>`:""}

				<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 15px 0;">
					<img src="${Z}" alt="QR Factura" style="width: 110px; height: 110px; border: 1px solid #ddd; padding: 4px; border-radius: 4px;" />
				</div>

				<div class="footer" style="text-align: center; font-size: 8.5px; font-weight: normal; line-height: 1.3; margin-top: 10px; color: #333;">
					<div style="margin-bottom: 5px; font-weight: bold;">"ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO DE ÉSTA SERÁ SANCIONADO DE ACUERDO A LEY"</div>
					<div style="margin-bottom: 5px; font-style: italic;">"Este documento es la representación gráfica de un Documento Digital Emitido en una Modalidad de Facturación en Línea"</div>
					<div>${t.footer||__("¡Gracias por su preferencia!")}</div>
				</div>
			</div>`}return`
			<div class="receipt">
				<div class="header" style="text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
					<div class="company-name" style="font-size: 15px; font-weight: bold; margin-bottom: 2px;">${t.company||""}</div>
					${t.company_address?`<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">${t.company_address}</div>`:""}
					${t.company_phone?`<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">Teléfono: ${t.company_phone}</div>`:""}
					<div style="font-size: 11px; font-weight: bold; letter-spacing: 0.5px; margin-top: 2px;">${g}</div>
				</div>

				${t.is_offline?`<div class="offline-badge" style="text-align: center; font-size: 10px; font-weight: bold; border: 1px dashed #000; padding: 3px; margin-bottom: 6px;">${__("OFFLINE — PENDING SYNC")}</div>`:""}

				<div class="invoice-info" style="font-size: 10px; margin-bottom: 6px; line-height: 1.3; border-bottom: 1px dashed #000; padding-bottom: 4px;">
					<div style="display: flex; justify-content: space-between;"><span>${I}</span><span><strong>${t.name}</strong></span></div>
					<div style="display: flex; justify-content: space-between;"><span>${__("Fecha:")}</span><span>${d(t.posting_date)}</span></div>
					${t.customer_name||t.customer?`<div style="display: flex; justify-content: space-between;"><span>${__("Cliente:")}</span><span>${(t.customer_name||t.customer).toUpperCase()}</span></div>`:""}
					${a?`<div style="display: flex; justify-content: space-between;"><span>${__("Vendedor:")}</span><span>${a}</span></div>`:""}
				</div>

				<div class="items-table" style="margin-bottom: 6px; padding: 4px 0;">
					${b}
				</div>

				<div class="totals">
					<div class="total-row grand-total" style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px;">
						<span>${__("TOTAL {0}:",[o])}</span>
						<span>${c(t.grand_total)}</span>
					</div>
				</div>

				<div class="footer" style="text-align: center; margin-top: 8px; padding-top: 4px; border-top: 1px dashed #000; font-size: 9px; font-weight: normal;">
					<div>${t.footer||__("¡Gracias por su preferencia!")}</div>
				</div>
			</div>`}function dt(t,{includeControls:e=!1}={}){const n=String((t==null?void 0:t.custom_telefono_contacto)||(t==null?void 0:t.contact_mobile)||(t==null?void 0:t.mobile_no)||"").replace(/\D/g,""),s=n.length===8&&(n.startsWith("6")||n.startsWith("7"))?`591${n}`:n,o=t!=null&&t.public_pdf_url?`
Descargar Comprobante en PDF:
${t.public_pdf_url.startsWith("http")?t.public_pdf_url:window.location.origin+t.public_pdf_url}`:"",r=encodeURIComponent(`*${((t==null?void 0:t.company)||"Muebles Ruffino").toUpperCase()}*
*Comprobante: ${(t==null?void 0:t.name)||""}*
Cliente: ${(t==null?void 0:t.customer_name)||(t==null?void 0:t.customer)||"Cliente Mostrador"}
Total: Bs. ${c((t==null?void 0:t.grand_total)||0)}${o}
¡Gracias por su preferencia!`),a=s?`https://wa.me/${s}?text=${r}`:`https://wa.me/?text=${r}`,{headerTitle:d,enableWhatsappSend:l}=it(t),i=l?`<a href="${a}" target="_blank" rel="noopener noreferrer" style="padding: 9px 16px; font-size: 13px; font-weight: bold; cursor: pointer; border-radius: 6px; background: #16a34a; color: #fff; text-decoration: none; display: inline-block;">WhatsApp</a>`:"",b=e?`
			<div class="no-print" style="text-align: center; margin-top: 20px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
				<button onclick="window.print()" style="padding: 9px 16px; font-size: 13px; font-weight: bold; cursor: pointer; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;">${__("Print Receipt")}</button>
				${i}
				<button onclick="window.close()" style="padding: 9px 16px; font-size: 13px; cursor: pointer; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc;">${__("Close")}</button>
			</div>`:"";return`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>${d} - ${t.name}</title>
			<style>${kt}</style>
		</head>
		<body>
			${Mt(t)}
			${b}
		</body>
		</html>`}function et(t,e,n){return u(this,null,function*(){if(e)return{printFormat:e,letterhead:n};if(t)try{const s=yield C("frappe.client.get",{doctype:"POS Profile",name:t});if(s)return{printFormat:s.print_format||tt,letterhead:n||s.letter_head||null}}catch(s){x.warn("Could not fetch POS Profile print settings:",s)}return{printFormat:tt,letterhead:n}})}function nt(t,e=null,n=null){return u(this,null,function*(){try{if(!(t!=null&&t.name))throw new Error("Invalid invoice data");return t=yield G(t),t=yield R(t),lt(t)}catch(s){return x.error("Print failed:",s),!1}})}function Vt(t,e=null,n=null){return u(this,null,function*(){var r;if(H(t)){let a=yield G({name:t});if(!((r=a.items)!=null&&r.length))throw new Error(__("This offline receipt is no longer in browser storage. Complete checkout again or sync, then print from history."));a=yield R(a);const d=yield et(a.pos_profile,e,n);return nt(a,d.printFormat,d.letterhead)}let s=yield C("pos_next.api.invoices.get_invoice",{invoice_name:t});if(!s)throw new Error("Invoice not found");s=yield R(s);const o=yield et(s.pos_profile,e,n);return nt(s,o.printFormat,o.letterhead)})}function Yt(t,e,n){return u(this,null,function*(){var d,l;const s=yield C("frappe.www.printview.get_html_and_style",{doc:t,name:e,print_format:n,no_letterhead:1}),o=(s==null?void 0:s.html)||((d=s==null?void 0:s.message)==null?void 0:d.html),r=(s==null?void 0:s.style)||((l=s==null?void 0:s.message)==null?void 0:l.style)||"";if(!o)throw new Error("Failed to get print HTML from server");const a=`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${r}</style></head>
<body>${o}</body>
</html>`;return yield at(a),!0})}function Lt(t){return u(this,null,function*(){const e=dt(t,{includeControls:!1});return yield at(e),x.info(`Silent print (local receipt) for ${t==null?void 0:t.name}`),pt(t==null?void 0:t.name),!0})}function Kt(t,e=null){return u(this,null,function*(){if(t=yield G(t),t=yield R(t),!(t==null?void 0:t.name))throw new Error("Invalid invoice data — missing name");try{return yield Lt(t),{method:"silent",success:!0}}catch(s){x.warn("Silent local receipt failed, falling back to browser:",(s==null?void 0:s.message)||s)}try{return lt(t),{method:"browser",success:!0}}catch(s){return x.error("Browser print for local receipt failed:",s),{method:"browser",success:!1}}})}function lt(t){const e=window.open("","_blank","width=350,height=600");if(!e)throw x.error("Cannot open print window — popup blocked."),new Error(__("Popup blocked — check your browser settings."));const n=dt(t,{includeControls:!0});return e.document.write(n),e.document.close(),pt(t==null?void 0:t.name),!0}export{Kt as a,Vt as b,rt as c,Gt as d,j as e,M as f,Zt as g,G as h,H as i,Nt as j,Ht as k,nt as p,A as q,Yt as s,qt as u};
