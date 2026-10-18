import type { AppData } from '../domain/model';
export const seed: AppData = {
 version: 1,
 customers: [
 {id:'c1',name:'Mphatso Banda',phone:'+265881000001',site:'Area 43, Lilongwe'},
 {id:'c2',name:'Chisomo Office Park',phone:'+265991000002',site:'City Centre, Lilongwe'},
 {id:'c3',name:'Tadala Phiri',phone:'+265881000003',site:'Chilomoni, Blantyre'}],
 quotes: [
 {id:'q1',customerId:'c1',title:'Interior painting · 3 bedrooms',trade:'Painting',discount:'0',createdAt:'2026-10-18T08:00:00Z',status:'Draft',lines:[{id:'l1',description:'Wall preparation and painting',quantity:'3',unit:'room',price:'45000'},{id:'l2',description:'Paint and materials',quantity:'1',unit:'job',price:'85000'}]},
 {id:'q2',customerId:'c3',title:'Steel gate fabrication',trade:'Welding',discount:'5',createdAt:'2026-10-18T09:00:00Z',status:'Draft',lines:[{id:'l3',description:'Materials, fabrication and installation',quantity:'1',unit:'job',price:'420000'}]}],
 jobs: [
 {id:'j1',customerId:'c2',title:'Office deep clean',trade:'Cleaning',due:'2026-10-21',status:'Scheduled',note:'Confirm access with the site contact.'},
 {id:'j2',customerId:'c1',title:'Kitchen cabinet installation',trade:'Carpentry',due:'2026-10-22',status:'In progress',note:'Fitting the cabinet doors.'},
 {id:'j3',customerId:'c3',title:'Bathroom pipe repair',trade:'Plumbing',due:'2026-10-24',status:'On hold',note:'Waiting for replacement fittings.'}]
};
