import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Chips, Field, ui } from './ui';
import { id, normalisePhone, trades, validDate } from '../domain/model';
import type { AppData, Customer, Job, Quote, QuoteLine, Trade } from '../domain/model';
import { money, quoteTotals } from '../domain/money';
export type EditorKind = 'customer'|'quote'|'job';
export function Editor({kind,data,onSave,onCancel,quote}:{kind:EditorKind;data:AppData;onSave:(value:Customer|Quote|Job)=>Promise<void>;onCancel:()=>void;quote?:Quote}) {
 const [name,setName]=useState(quote?.title??'');const [phone,setPhone]=useState('');const [site,setSite]=useState('');
 const [customerId,setCustomer]=useState(quote?.customerId??data.customers[0]?.id??'');const [trade,setTrade]=useState<Trade>(quote?.trade??'Painting');
 const [due,setDue]=useState('');const [note,setNote]=useState(''); const [discount,setDiscount]=useState(quote?.discount??'0');
 const [lines,setLines]=useState<QuoteLine[]>(quote?.lines.map(l=>({...l}))??[{id:id(),description:'',quantity:'1',unit:'job',price:''}]);
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 function updateLine(key:string,patch:Partial<QuoteLine>){setLines(rows=>rows.map(l=>l.id===key?{...l,...patch}:l));}
 let total='Add items to calculate your quotation';try{total=money(quoteTotals(lines,discount).total);}catch{}
 async function save(){setError('');setBusy(true);try {
  if(!name.trim())throw new Error(kind==='customer'?'Enter the customer name.':'Enter a title for this work.');
  if(kind==='customer')await onSave({id:id(),name:name.trim(),phone:normalisePhone(phone),site:site.trim()});
  else {
   if(!data.customers.some(c=>c.id===customerId))throw new Error('Add and select a customer first.');
   if(kind==='quote'){quoteTotals(lines,discount);await onSave({id:quote?.id??id(),customerId,title:name.trim(),trade,lines:lines.map(l=>({...l,description:l.description.trim()})),discount,createdAt:quote?.createdAt??new Date().toISOString(),status:'Draft'});}
   else {if(!validDate(due))throw new Error('Enter a real date in YYYY-MM-DD format.');await onSave({id:id(),customerId,title:name.trim(),trade,due,status:'Scheduled',note:note.trim()});}
  }
 }catch(e){setError(e instanceof Error?e.message:'Could not save. Your input is still here.');}finally{setBusy(false);}}
 return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:24,gap:12}}>
 <Text style={ui.title}>{kind==='customer'?'New customer':kind==='quote'?(quote?'Edit quotation draft':'New quotation'):'New direct job'}</Text>
 <Text style={ui.muted}>{kind==='quote'?'Build a clear scope. This phase saves drafts only.':kind==='job'?'Record agreed work without claiming online customer approval.':'Keep your customer and site details together.'}</Text>
 <Field label={kind==='customer'?'Customer name':'Work title'} value={name} onChangeText={setName}/>
 {kind==='customer'?<><Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="0881 234 567"/><Field label="Site / area" value={site} onChangeText={setSite}/></>:<>
 <Text style={ui.label}>Customer</Text>{data.customers.length?<Chips items={data.customers.map(c=>c.name+' · '+c.phone)} value={data.customers.find(c=>c.id===customerId)?.name+' · '+data.customers.find(c=>c.id===customerId)?.phone} onChange={s=>setCustomer(data.customers.find(c=>c.name+' · '+c.phone===s)!.id)}/>:<Text style={ui.muted}>Create a customer before saving this work.</Text>}
 <Text style={ui.label}>Service</Text><Chips items={trades} value={trade} onChange={s=>setTrade(s as Trade)}/>
 {kind==='job'?<><Field label="Scheduled date (YYYY-MM-DD)" value={due} onChangeText={setDue} placeholder="2026-10-25"/><Field label="Job notes" value={note} onChangeText={setNote} multiline/></>:<>
 {lines.map((line,index)=><View key={line.id} style={[ui.card,{padding:16}]}><Text style={ui.label}>Item {index+1}</Text><Field label="Description" value={line.description} onChangeText={s=>updateLine(line.id,{description:s})}/><Field label="Quantity" value={line.quantity} onChangeText={s=>updateLine(line.id,{quantity:s})} numeric/><Field label="Unit" value={line.unit} onChangeText={s=>updateLine(line.id,{unit:s})}/><Field label="Unit price (MWK)" value={line.price} onChangeText={s=>updateLine(line.id,{price:s})} numeric/>{lines.length>1&&<Button title="Remove item" secondary onPress={()=>setLines(rows=>rows.filter(l=>l.id!==line.id))}/>}</View>)}
 <Button title="+ Add item" secondary onPress={()=>setLines(rows=>[...rows,{id:id(),description:'',quantity:'1',unit:'job',price:''}])}/>
 <Field label="Discount (%)" value={discount} onChangeText={setDiscount} numeric/><Text style={ui.title}>{total}</Text><Text style={ui.muted}>Tax disabled · No invoice or payment is issued</Text>
 </>}
 </>}
 {!!error&&<Text accessibilityRole="alert" style={{color:'#A33124',lineHeight:21}}>{error}</Text>}
 <View style={ui.row}><Button title={busy?'Saving…':'Save '+(kind==='quote'?'draft':kind)} disabled={busy} onPress={save}/><Button title="Cancel" secondary disabled={busy} onPress={onCancel}/></View>
 </ScrollView>;
}
