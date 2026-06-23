// Gbitse CRM — Nigeria HR/OD Lead Intelligence
// 500+ companies auto-generated from Phase 2 Universe Catalog + expansion agents
// Generated: 2026-05-30

let _id = 0;
const id = (prefix) => `${prefix}-${String(++_id).padStart(3,'0')}`;

function score(c) {
  let s = 0;
  if (c.employees >= 5000) s += 20; else if (c.employees >= 1000) s += 16; else if (c.employees >= 500) s += 12; else if (c.employees >= 200) s += 8;
  if (['Lagos','Abuja'].includes(c.hqCity)) s += 12;
  if (c.sector === 'banking') s += 14; else if (c.sector === 'government') s += 12; else if (['fintech','pension','insurance','oil-gas'].includes(c.sector)) s += 10; else s += 8;
  if (c.ngxListed) s += 6;
  if (c.parent) s += 4;
  if (c.ownership === 'government') s += 6;
  if (c.status === 'client') s += 18;
  return Math.min(s, 100);
}

function tier(s) { return s >= 55 ? 'hot' : s >= 38 ? 'warm' : s >= 25 ? 'cool' : 'watch'; }

function make(prefix, arr) {
  return arr.map(c => {
    const s = score(c);
    return { id: id(prefix), ...c, score: s, tier: tier(s) };
  });
}

// ========== BANKING (35) ==========
const BANKING = make('BNK', [
  {name:"Access Bank",sector:"banking",subSector:"Commercial (International)",employees:9960,hqCity:"Lagos",website:"accessbankplc.com",ownership:"public",ngxListed:true,parent:"Access Holdings",status:"new"},
  {name:"Zenith Bank",sector:"banking",subSector:"Commercial (International)",employees:10520,hqCity:"Lagos",website:"zenithbank.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"First Bank of Nigeria",sector:"banking",subSector:"Commercial (International)",employees:16000,hqCity:"Lagos",website:"firstbanknigeria.com",ownership:"public",ngxListed:true,parent:"FBN Holdings",status:"new"},
  {name:"GTBank / GTCO",sector:"banking",subSector:"Commercial (International)",employees:5864,hqCity:"Lagos",website:"gtbank.com",ownership:"public",ngxListed:true,parent:"GTCO PLC",status:"new"},
  {name:"UBA",sector:"banking",subSector:"Commercial (International)",employees:10821,hqCity:"Lagos",website:"ubagroup.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Fidelity Bank",sector:"banking",subSector:"Commercial (International)",employees:3100,hqCity:"Lagos",website:"fidelitybank.ng",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"FCMB",sector:"banking",subSector:"Commercial (International)",employees:3796,hqCity:"Lagos",website:"fcmb.com",ownership:"public",ngxListed:true,parent:"FCMB Group",status:"client"},
  {name:"Stanbic IBTC",sector:"banking",subSector:"Commercial (National)",employees:3304,hqCity:"Lagos",website:"stanbicibtcbank.com",ownership:"public",ngxListed:true,parent:"Standard Bank Group",status:"client"},
  {name:"Ecobank Nigeria",sector:"banking",subSector:"Commercial (National)",employees:6800,hqCity:"Lagos",website:"ecobank.com/ng",ownership:"private",ngxListed:false,parent:"ETI",status:"client"},
  {name:"Sterling Bank",sector:"banking",subSector:"Commercial (National)",employees:3000,hqCity:"Lagos",website:"sterling.ng",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Union Bank",sector:"banking",subSector:"Commercial (National)",employees:2800,hqCity:"Lagos",website:"unionbankng.com",ownership:"private",ngxListed:true,parent:"Titan Trust",status:"new"},
  {name:"Wema Bank",sector:"banking",subSector:"Commercial (National)",employees:2342,hqCity:"Lagos",website:"wemabank.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Quest Merchant Bank",sector:"banking",subSector:"Merchant Bank",employees:200,hqCity:"Lagos",website:null,ownership:"private",ngxListed:false,parent:null,status:"client"},
  {name:"Keystone Bank",sector:"banking",subSector:"Commercial (National)",employees:2500,hqCity:"Lagos",website:"keystonebankng.com",ownership:"government",ngxListed:false,parent:"AMCON",status:"new"},
  {name:"Polaris Bank",sector:"banking",subSector:"Commercial (National)",employees:3000,hqCity:"Lagos",website:"polarisbanklimited.com",ownership:"government",ngxListed:false,parent:"AMCON",status:"new"},
  {name:"Unity Bank",sector:"banking",subSector:"Commercial (National)",employees:2000,hqCity:"Lagos",website:"unitybankng.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Jaiz Bank",sector:"banking",subSector:"Non-Interest (Islamic)",employees:800,hqCity:"Abuja",website:"jaizbankplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"TAJBank",sector:"banking",subSector:"Non-Interest (Islamic)",employees:2000,hqCity:"Abuja",website:"tajbank.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Lotus Bank",sector:"banking",subSector:"Non-Interest (Islamic)",employees:700,hqCity:"Lagos",website:"lotusbank.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Citibank Nigeria",sector:"banking",subSector:"Commercial (International)",employees:300,hqCity:"Lagos",website:"citigroup.com/nigeria",ownership:"private",ngxListed:false,parent:"Citigroup",status:"new"},
  {name:"Standard Chartered Nigeria",sector:"banking",subSector:"Commercial (International)",employees:700,hqCity:"Lagos",website:"sc.com/ng",ownership:"private",ngxListed:false,parent:"Standard Chartered PLC",status:"new"},
  {name:"Premium Trust Bank",sector:"banking",subSector:"Commercial (National)",employees:750,hqCity:"Lagos",website:"premiumtrustbank.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Providus Bank",sector:"banking",subSector:"Commercial (National)",employees:750,hqCity:"Lagos",website:"providusbank.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Globus Bank",sector:"banking",subSector:"Commercial (National)",employees:400,hqCity:"Lagos",website:"globusbank.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Coronation Merchant Bank",sector:"banking",subSector:"Merchant Bank",employees:260,hqCity:"Lagos",website:"coronationmb.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"FBNQuest Merchant Bank",sector:"banking",subSector:"Merchant Bank",employees:200,hqCity:"Lagos",website:"fbnquest.com",ownership:"private",ngxListed:false,parent:"FBN Holdings",status:"new"},
  {name:"FSDH Merchant Bank",sector:"banking",subSector:"Merchant Bank",employees:250,hqCity:"Lagos",website:"fsdhmerchantbank.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Nova Merchant Bank",sector:"banking",subSector:"Merchant Bank",employees:265,hqCity:"Lagos",website:"novambl.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Greenwich Merchant Bank",sector:"banking",subSector:"Merchant Bank",employees:200,hqCity:"Lagos",website:"greenwichmb.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Bank of Industry (BOI)",sector:"banking",subSector:"Development Finance",employees:1000,hqCity:"Lagos",website:"boi.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NEXIM Bank",sector:"banking",subSector:"Development Finance",employees:200,hqCity:"Abuja",website:"neximbank.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"Development Bank of Nigeria",sector:"banking",subSector:"Development Finance",employees:200,hqCity:"Abuja",website:"devbankng.com",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"Alternative Bank",sector:"banking",subSector:"Non-Interest (Islamic)",employees:500,hqCity:"Lagos",website:"altbank.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Signature Bank",sector:"banking",subSector:"Commercial (Regional)",employees:200,hqCity:"Abuja",website:"signaturebankng.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"SunTrust Bank",sector:"banking",subSector:"Commercial (Regional)",employees:200,hqCity:"Lagos",website:"suntrustng.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== GOVERNMENT (45) ==========
const GOVERNMENT = make('GOV', [
  {name:"NNPC Limited",sector:"government",subSector:"Oil & Gas / National Oil Company",employees:7300,hqCity:"Abuja",website:"nnpcgroup.com",ownership:"government",ngxListed:false,parent:null,status:"client"},
  {name:"Nigeria Revenue Service (NRS)",sector:"government",subSector:"Tax Administration",employees:8000,hqCity:"Abuja",website:"firs.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"client"},
  {name:"Central Bank of Nigeria (CBN)",sector:"government",subSector:"Financial Regulation",employees:10000,hqCity:"Abuja",website:"cbn.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"client"},
  {name:"NCC",sector:"government",subSector:"Telecom Regulation",employees:2000,hqCity:"Abuja",website:"ncc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NAFDAC",sector:"government",subSector:"Food & Drug Regulation",employees:5000,hqCity:"Abuja",website:"nafdac.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"Nigeria Customs Service",sector:"government",subSector:"Customs & Border Revenue",employees:15000,hqCity:"Abuja",website:"customs.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"FAAN",sector:"government",subSector:"Aviation",employees:6000,hqCity:"Lagos",website:"faan.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"Nigerian Ports Authority",sector:"government",subSector:"Maritime",employees:5000,hqCity:"Lagos",website:"nigerianports.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"TCN",sector:"government",subSector:"Power Transmission",employees:8000,hqCity:"Abuja",website:"tcn.org.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"SEC Nigeria",sector:"government",subSector:"Capital Markets Regulation",employees:500,hqCity:"Abuja",website:"sec.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"PenCom",sector:"government",subSector:"Pension Regulation",employees:500,hqCity:"Abuja",website:"pencom.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NAICOM",sector:"government",subSector:"Insurance Regulation",employees:300,hqCity:"Abuja",website:"naicom.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NDIC",sector:"government",subSector:"Deposit Insurance",employees:500,hqCity:"Abuja",website:"ndic.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"AMCON",sector:"government",subSector:"Asset Recovery",employees:350,hqCity:"Abuja",website:"amcon.com.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"EFCC",sector:"government",subSector:"Financial Crimes",employees:3000,hqCity:"Abuja",website:"efcc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"FRSC",sector:"government",subSector:"Road Safety",employees:20000,hqCity:"Abuja",website:"frsc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"Nigeria Immigration Service",sector:"government",subSector:"Immigration",employees:25000,hqCity:"Abuja",website:"immigration.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NDLEA",sector:"government",subSector:"Drug Enforcement",employees:5000,hqCity:"Abuja",website:"ndlea.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NSCDC",sector:"government",subSector:"Civil Defence",employees:63000,hqCity:"Abuja",website:"nscdc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NIMASA",sector:"government",subSector:"Maritime Safety",employees:700,hqCity:"Lagos",website:"nimasa.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NCAA",sector:"government",subSector:"Aviation Regulation",employees:1000,hqCity:"Abuja",website:"ncaa.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NERC",sector:"government",subSector:"Electricity Regulation",employees:220,hqCity:"Abuja",website:"nerc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NITDA",sector:"government",subSector:"Technology Regulation",employees:700,hqCity:"Abuja",website:"nitda.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"Galaxy Backbone",sector:"government",subSector:"Government ICT",employees:350,hqCity:"Abuja",website:"galaxybackbone.com.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NIPOST",sector:"government",subSector:"Postal Services",employees:12000,hqCity:"Abuja",website:"nipost.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"INEC",sector:"government",subSector:"Electoral Administration",employees:15000,hqCity:"Abuja",website:"inecnigeria.org",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NBS",sector:"government",subSector:"Statistics",employees:500,hqCity:"Abuja",website:"nigerianstat.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"CAC",sector:"government",subSector:"Business Registration",employees:2500,hqCity:"Abuja",website:"cac.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NIPC",sector:"government",subSector:"Investment Promotion",employees:200,hqCity:"Abuja",website:"nipc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"SMEDAN",sector:"government",subSector:"SME Development",employees:200,hqCity:"Abuja",website:"smedan.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NDE",sector:"government",subSector:"Employment & Training",employees:2000,hqCity:"Abuja",website:"nde.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"ITF",sector:"government",subSector:"Industrial Training",employees:5000,hqCity:"Abuja",website:"itf.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NDPHC",sector:"government",subSector:"Power Generation",employees:700,hqCity:"Abuja",website:"ndphc.net",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NHIA",sector:"government",subSector:"Health Insurance",employees:500,hqCity:"Abuja",website:"nhia.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"SON",sector:"government",subSector:"Standards & Quality",employees:2500,hqCity:"Abuja",website:"son.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"BPE",sector:"government",subSector:"Privatisation",employees:200,hqCity:"Abuja",website:"bpe.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NUC",sector:"government",subSector:"University Regulation",employees:700,hqCity:"Abuja",website:"nuc.edu.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"ICPC",sector:"government",subSector:"Anti-Corruption",employees:500,hqCity:"Abuja",website:"icpc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"FHA",sector:"government",subSector:"Housing Development",employees:350,hqCity:"Abuja",website:"fha.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NUPRC",sector:"government",subSector:"Upstream Petroleum",employees:500,hqCity:"Abuja",website:"nuprc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NMDPRA",sector:"government",subSector:"Downstream Petroleum",employees:500,hqCity:"Abuja",website:"nmdpra.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NTA",sector:"government",subSector:"Broadcasting",employees:5000,hqCity:"Abuja",website:"nta.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"ICPC",sector:"government",subSector:"Anti-Corruption",employees:500,hqCity:"Abuja",website:"icpc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
]);

// ========== OIL & GAS (25) ==========
const OIL_GAS = make('OG', [
  {name:"Shell Nigeria (SPDC)",sector:"oil-gas",subSector:"E&P / IOC",employees:5000,hqCity:"Lagos",website:"shell.com.ng",ownership:"private",ngxListed:false,parent:"Shell PLC",status:"new"},
  {name:"Chevron Nigeria",sector:"oil-gas",subSector:"E&P / IOC",employees:3000,hqCity:"Lagos",website:"chevron.com",ownership:"private",ngxListed:false,parent:"Chevron Corp",status:"new"},
  {name:"ExxonMobil Nigeria",sector:"oil-gas",subSector:"E&P / IOC",employees:2000,hqCity:"Lagos",website:"exxonmobil.com",ownership:"private",ngxListed:false,parent:"ExxonMobil Corp",status:"new"},
  {name:"TotalEnergies EP Nigeria",sector:"oil-gas",subSector:"E&P / IOC",employees:1800,hqCity:"Lagos",website:"totalenergies.com.ng",ownership:"private",ngxListed:false,parent:"TotalEnergies SE",status:"new"},
  {name:"Seplat Energy",sector:"oil-gas",subSector:"E&P (Indigenous)",employees:800,hqCity:"Lagos",website:"seplatenergy.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Oando PLC",sector:"oil-gas",subSector:"Integrated Energy",employees:1000,hqCity:"Lagos",website:"oandoplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"NLNG",sector:"oil-gas",subSector:"LNG Processing",employees:2500,hqCity:"Lagos",website:"nlng.com",ownership:"private",ngxListed:false,parent:"NNPC/Shell/Total/Eni JV",status:"new"},
  {name:"Ardova PLC",sector:"oil-gas",subSector:"Downstream Marketing",employees:800,hqCity:"Lagos",website:"ardovaplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Conoil PLC",sector:"oil-gas",subSector:"Downstream Marketing",employees:500,hqCity:"Lagos",website:"conoilplc.com",ownership:"public",ngxListed:true,parent:"Mike Adenuga Group",status:"new"},
  {name:"MRS Oil Nigeria",sector:"oil-gas",subSector:"Downstream Marketing",employees:400,hqCity:"Lagos",website:"mrsoilnig.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"11 PLC (formerly Mobil Oil)",sector:"oil-gas",subSector:"Downstream Marketing",employees:300,hqCity:"Lagos",website:"11plc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"SAPETRO",sector:"oil-gas",subSector:"E&P (Indigenous)",employees:300,hqCity:"Lagos",website:"sapetro.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Aiteo Group",sector:"oil-gas",subSector:"E&P / Downstream",employees:2000,hqCity:"Lagos",website:"aiteogroup.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Sahara Energy",sector:"oil-gas",subSector:"Energy Trading / Power",employees:1500,hqCity:"Lagos",website:"sahara-group.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Heirs Energies",sector:"oil-gas",subSector:"E&P (Indigenous)",employees:500,hqCity:"Lagos",website:"heirsholdings.com",ownership:"private",ngxListed:false,parent:"Heirs Holdings",status:"new"},
  {name:"Indorama Eleme Petrochemicals",sector:"oil-gas",subSector:"Petrochemicals / Fertilizer",employees:1500,hqCity:"Port Harcourt",website:"indorama.com",ownership:"private",ngxListed:false,parent:"Indorama Corp (Indonesia)",status:"new"},
  {name:"Notore Chemical Industries",sector:"oil-gas",subSector:"Fertilizer / Petrochemicals",employees:500,hqCity:"Lagos",website:"notore.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"SLB Nigeria (Schlumberger)",sector:"oil-gas",subSector:"Oilfield Services",employees:2000,hqCity:"Lagos",website:"slb.com",ownership:"private",ngxListed:false,parent:"SLB",status:"new"},
  {name:"Halliburton Nigeria",sector:"oil-gas",subSector:"Oilfield Services",employees:1500,hqCity:"Lagos",website:"halliburton.com",ownership:"private",ngxListed:false,parent:"Halliburton",status:"new"},
  {name:"Baker Hughes Nigeria",sector:"oil-gas",subSector:"Oilfield Services",employees:1000,hqCity:"Lagos",website:"bakerhughes.com",ownership:"private",ngxListed:false,parent:"Baker Hughes",status:"new"},
  {name:"Saipem Nigeria",sector:"oil-gas",subSector:"EPC / Construction",employees:1200,hqCity:"Lagos",website:"saipem.com",ownership:"private",ngxListed:false,parent:"Saipem (Italy)",status:"new"},
  {name:"Dangote Refinery",sector:"oil-gas",subSector:"Refining",employees:5000,hqCity:"Lagos",website:"dangote.com",ownership:"private",ngxListed:false,parent:"Dangote Group",status:"new"},
  {name:"NIPCO PLC",sector:"oil-gas",subSector:"Downstream Marketing",employees:500,hqCity:"Lagos",website:"nipcoplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Eterna PLC",sector:"oil-gas",subSector:"Downstream Marketing",employees:300,hqCity:"Lagos",website:"eternaplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Aradel Holdings (formerly Pan Ocean)",sector:"oil-gas",subSector:"E&P (Indigenous)",employees:500,hqCity:"Lagos",website:"aradelholdings.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
]);

// ========== CONGLOMERATES & INDUSTRIALS (20) ==========
const CONGLOMERATES = make('IND', [
  {name:"Dangote Group",sector:"conglomerates",subSector:"Diversified Industrial",employees:30000,hqCity:"Lagos",website:"dangote.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"BUA Group",sector:"conglomerates",subSector:"Diversified Industrial",employees:10000,hqCity:"Lagos",website:"buagroup.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Dangote Cement",sector:"conglomerates",subSector:"Cement / Building Materials",employees:10000,hqCity:"Lagos",website:"dangotecement.com",ownership:"public",ngxListed:true,parent:"Dangote Group",status:"new"},
  {name:"BUA Cement",sector:"conglomerates",subSector:"Cement / Building Materials",employees:3000,hqCity:"Lagos",website:"buacement.com",ownership:"public",ngxListed:true,parent:"BUA Group",status:"new"},
  {name:"Lafarge Africa",sector:"conglomerates",subSector:"Cement / Building Materials",employees:2500,hqCity:"Lagos",website:"lafarge.com.ng",ownership:"public",ngxListed:true,parent:"Holcim Group",status:"new"},
  {name:"Julius Berger Nigeria",sector:"conglomerates",subSector:"Construction / Engineering",employees:8859,hqCity:"Abuja",website:"julius-berger.com",ownership:"public",ngxListed:true,parent:"Julius Berger Int'l",status:"new"},
  {name:"Flour Mills of Nigeria",sector:"conglomerates",subSector:"Food Processing",employees:2014,hqCity:"Lagos",website:"fmnplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Heirs Holdings",sector:"conglomerates",subSector:"Diversified",employees:2000,hqCity:"Lagos",website:"heirsholdings.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Transcorp",sector:"conglomerates",subSector:"Power / Hospitality / Energy",employees:2000,hqCity:"Abuja",website:"transcorpgroup.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"UAC of Nigeria",sector:"conglomerates",subSector:"Diversified (Foods / Real Estate)",employees:1500,hqCity:"Lagos",website:"uacnplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Honeywell Group",sector:"conglomerates",subSector:"Flour / Foods / Energy",employees:1500,hqCity:"Lagos",website:"honeywellgroup.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"CCECC Nigeria",sector:"conglomerates",subSector:"Construction / Infrastructure",employees:3000,hqCity:"Abuja",website:"ccecc.com.ng",ownership:"private",ngxListed:false,parent:"CCECC (China)",status:"new"},
  {name:"Setraco Nigeria",sector:"conglomerates",subSector:"Construction / Roads",employees:1000,hqCity:"Abuja",website:"setraco-ng.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"UPDC PLC",sector:"conglomerates",subSector:"Real Estate Development",employees:300,hqCity:"Lagos",website:"updcplc.com",ownership:"public",ngxListed:true,parent:"UAC of Nigeria",status:"new"},
  {name:"Mixta Africa",sector:"conglomerates",subSector:"Real Estate / Housing",employees:400,hqCity:"Lagos",website:"mixtaafrica.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Brains & Hammers",sector:"conglomerates",subSector:"Real Estate Development",employees:300,hqCity:"Abuja",website:"brainsandhammers.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Dangote Sugar Refinery",sector:"conglomerates",subSector:"Sugar Refining",employees:2988,hqCity:"Lagos",website:"dangotesugar.com",ownership:"public",ngxListed:true,parent:"Dangote Group",status:"new"},
  {name:"Stallion Group",sector:"conglomerates",subSector:"Diversified (Auto / Agric / FMCG)",employees:3000,hqCity:"Lagos",website:"stalliongroup.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"IHS Towers Nigeria",sector:"conglomerates",subSector:"Telecom Towers",employees:1559,hqCity:"Lagos",website:"ihstowers.com",ownership:"public",ngxListed:false,parent:"IHS Holding",status:"new"},
  {name:"Tolaram Group Nigeria",sector:"conglomerates",subSector:"Diversified FMCG",employees:5000,hqCity:"Lagos",website:"tolaram.com",ownership:"private",ngxListed:false,parent:"Tolaram (Singapore)",status:"new"},
]);

// ========== TELECOMS (5) ==========
const TELECOMS = make('TEL', [
  {name:"MTN Nigeria",sector:"telecoms",subSector:"Mobile Network Operator",employees:3500,hqCity:"Lagos",website:"mtn.ng",ownership:"public",ngxListed:true,parent:"MTN Group",status:"new"},
  {name:"Airtel Nigeria",sector:"telecoms",subSector:"Mobile Network Operator",employees:2500,hqCity:"Lagos",website:"airtel.com.ng",ownership:"public",ngxListed:false,parent:"Bharti Airtel",status:"new"},
  {name:"Globacom",sector:"telecoms",subSector:"Mobile Network Operator",employees:3000,hqCity:"Lagos",website:"gloworld.com",ownership:"private",ngxListed:false,parent:"Mike Adenuga Group",status:"new"},
  {name:"9Mobile (EMTS)",sector:"telecoms",subSector:"Mobile Network Operator",employees:1000,hqCity:"Lagos",website:"9mobile.com.ng",ownership:"private",ngxListed:false,parent:"Teleology Holdings",status:"new"},
  {name:"ntel",sector:"telecoms",subSector:"4G/LTE Operator",employees:300,hqCity:"Abuja",website:"ntel.com.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== CONSUMER GOODS / FMCG (20) ==========
const CONSUMER = make('CG', [
  {name:"Nigerian Breweries",sector:"consumer-goods",subSector:"Beverages",employees:6811,hqCity:"Lagos",website:"nbplc.com",ownership:"public",ngxListed:true,parent:"Heineken NV",status:"new"},
  {name:"Nestle Nigeria",sector:"consumer-goods",subSector:"FMCG / Food",employees:2603,hqCity:"Lagos",website:"nestle-cwa.com",ownership:"public",ngxListed:true,parent:"Nestle SA",status:"new"},
  {name:"Guinness Nigeria (Tolaram)",sector:"consumer-goods",subSector:"Beverages",employees:1200,hqCity:"Lagos",website:"guinness-nigeria.com",ownership:"private",ngxListed:true,parent:"Tolaram Group",status:"new"},
  {name:"International Breweries (ABInBev)",sector:"consumer-goods",subSector:"Beverages",employees:2000,hqCity:"Lagos",website:"intbreweries.com",ownership:"public",ngxListed:true,parent:"ABInBev",status:"new"},
  {name:"Unilever Nigeria",sector:"consumer-goods",subSector:"FMCG / Personal Care",employees:800,hqCity:"Lagos",website:"unilever.com.ng",ownership:"public",ngxListed:true,parent:"Unilever NV",status:"new"},
  {name:"PZ Cussons Nigeria",sector:"consumer-goods",subSector:"FMCG / Personal Care",employees:700,hqCity:"Lagos",website:"pzcussons.com.ng",ownership:"public",ngxListed:true,parent:"PZ Cussons PLC",status:"new"},
  {name:"Cadbury Nigeria",sector:"consumer-goods",subSector:"Confectionery",employees:500,hqCity:"Lagos",website:"cadbury.com.ng",ownership:"public",ngxListed:true,parent:"Mondelez Int'l",status:"new"},
  {name:"Dufil Prima Foods (Indomie)",sector:"consumer-goods",subSector:"Instant Noodles / Food",employees:5000,hqCity:"Lagos",website:"dufil.com",ownership:"private",ngxListed:false,parent:"De United Foods",status:"new"},
  {name:"FrieslandCampina WAMCO",sector:"consumer-goods",subSector:"Dairy (Peak Milk)",employees:1200,hqCity:"Lagos",website:"frieslandcampina.com.ng",ownership:"private",ngxListed:false,parent:"FrieslandCampina (Netherlands)",status:"new"},
  {name:"Promasidor Nigeria",sector:"consumer-goods",subSector:"Dairy / Beverages (Cowbell)",employees:1500,hqCity:"Lagos",website:"promasidor.com",ownership:"private",ngxListed:false,parent:"Promasidor Holdings",status:"new"},
  {name:"CHI Limited",sector:"consumer-goods",subSector:"Beverages / Snacks (Hollandia/Chivita)",employees:2000,hqCity:"Lagos",website:"chi.com.ng",ownership:"private",ngxListed:false,parent:"Coca-Cola / TGI Group",status:"new"},
  {name:"BUA Foods",sector:"consumer-goods",subSector:"Food Processing (Sugar/Flour/Pasta)",employees:3000,hqCity:"Lagos",website:"buafoods.com",ownership:"public",ngxListed:true,parent:"BUA Group",status:"new"},
  {name:"Dangote Salt (NASCON)",sector:"consumer-goods",subSector:"Salt / Seasoning",employees:700,hqCity:"Lagos",website:"nasconplc.com",ownership:"public",ngxListed:true,parent:"Dangote Group",status:"new"},
  {name:"Vitafoam Nigeria",sector:"consumer-goods",subSector:"Foam / Mattresses",employees:666,hqCity:"Lagos",website:"vitafoamnig.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Olam Nigeria (Olam Agri)",sector:"consumer-goods",subSector:"Agri-Business / Food",employees:2500,hqCity:"Lagos",website:"olamgroup.com",ownership:"private",ngxListed:false,parent:"Olam Group (Singapore)",status:"new"},
  {name:"Beloxxi Industries",sector:"consumer-goods",subSector:"Biscuits / Snacks",employees:1000,hqCity:"Lagos",website:"beloxxi.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Emzor Pharmaceuticals",sector:"consumer-goods",subSector:"Pharmaceuticals / FMCG",employees:1000,hqCity:"Lagos",website:"emzorpharma.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Fidson Healthcare",sector:"consumer-goods",subSector:"Pharmaceuticals",employees:500,hqCity:"Lagos",website:"fidsonhealthcare.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"May & Baker Nigeria",sector:"consumer-goods",subSector:"Pharmaceuticals",employees:400,hqCity:"Lagos",website:"may-baker.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"GlaxoSmithKline Nigeria",sector:"consumer-goods",subSector:"Pharmaceuticals",employees:300,hqCity:"Lagos",website:"gsk.com",ownership:"private",ngxListed:false,parent:"GSK PLC",status:"new"},
]);

// ========== FINTECH (20) ==========
const FINTECH = make('FT', [
  {name:"OPay",sector:"fintech",subSector:"Mobile Payments / SuperApp",employees:4143,hqCity:"Lagos",website:"opayweb.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Moniepoint",sector:"fintech",subSector:"Payment Infrastructure",employees:3300,hqCity:"Lagos",website:"moniepoint.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"PalmPay",sector:"fintech",subSector:"Mobile Payments",employees:2391,hqCity:"Lagos",website:"palmpay.com",ownership:"private",ngxListed:false,parent:"Transsion Holdings",status:"new"},
  {name:"Interswitch",sector:"fintech",subSector:"Payment Processing",employees:1900,hqCity:"Lagos",website:"interswitchgroup.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Flutterwave",sector:"fintech",subSector:"Payment Gateway",employees:880,hqCity:"Lagos",website:"flutterwave.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Kuda Bank",sector:"fintech",subSector:"Digital Banking",employees:679,hqCity:"Lagos",website:"kuda.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Paystack",sector:"fintech",subSector:"Payment Gateway",employees:400,hqCity:"Lagos",website:"paystack.com",ownership:"private",ngxListed:false,parent:"Stripe",status:"new"},
  {name:"FairMoney",sector:"fintech",subSector:"Digital Lending",employees:1200,hqCity:"Lagos",website:"fairmoney.io",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Paga",sector:"fintech",subSector:"Mobile Money",employees:430,hqCity:"Lagos",website:"mypaga.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Renmoney",sector:"fintech",subSector:"Digital Lending",employees:1173,hqCity:"Lagos",website:"renmoney.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Carbon",sector:"fintech",subSector:"Digital Lending",employees:250,hqCity:"Lagos",website:"getcarbon.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"PiggyVest",sector:"fintech",subSector:"Savings & Investment",employees:250,hqCity:"Lagos",website:"piggyvest.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Cowrywise",sector:"fintech",subSector:"Savings & Investment",employees:200,hqCity:"Lagos",website:"cowrywise.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Nomba",sector:"fintech",subSector:"Payments / POS",employees:350,hqCity:"Lagos",website:"nomba.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Zone (Appzone)",sector:"fintech",subSector:"Payment Infrastructure (Blockchain)",employees:300,hqCity:"Lagos",website:"zone.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"LemFi",sector:"fintech",subSector:"Cross-border Payments",employees:300,hqCity:"Lagos",website:"lemfi.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Chipper Cash Nigeria",sector:"fintech",subSector:"Cross-border Payments",employees:300,hqCity:"Lagos",website:"chippercash.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"BudPay",sector:"fintech",subSector:"Payment Gateway",employees:200,hqCity:"Lagos",website:"budpay.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Brass",sector:"fintech",subSector:"Business Banking",employees:200,hqCity:"Lagos",website:"trybrass.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Grey Finance",sector:"fintech",subSector:"Cross-border / Virtual Banking",employees:200,hqCity:"Lagos",website:"grey.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== PENSION (20) ==========
const PENSION = make('PFA', [
  {name:"Trust Fund Pensions",sector:"pension",subSector:"PFA",employees:350,hqCity:"Abuja",website:"trustfundpensions.com",ownership:"private",ngxListed:false,parent:null,status:"client"},
  {name:"Stanbic IBTC Pension Managers",sector:"pension",subSector:"PFA",employees:500,hqCity:"Lagos",website:"stanbicibtcpension.com",ownership:"private",ngxListed:false,parent:"Stanbic IBTC Holdings",status:"new"},
  {name:"Access ARM Pensions",sector:"pension",subSector:"PFA",employees:400,hqCity:"Lagos",website:"accessarmpensions.com",ownership:"private",ngxListed:false,parent:"Access Holdings / ARM",status:"new"},
  {name:"Leadway Pensure",sector:"pension",subSector:"PFA",employees:350,hqCity:"Lagos",website:"leadway-pensure.com",ownership:"private",ngxListed:false,parent:"Leadway Holdings",status:"new"},
  {name:"Premium Pension",sector:"pension",subSector:"PFA",employees:400,hqCity:"Abuja",website:"premiumpension.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"FCMB Pensions",sector:"pension",subSector:"PFA",employees:258,hqCity:"Abuja",website:"fcmbpensions.com",ownership:"private",ngxListed:false,parent:"FCMB Group",status:"new"},
  {name:"GT Pension Managers",sector:"pension",subSector:"PFA",employees:200,hqCity:"Lagos",website:"gtpensionmanagers.com",ownership:"private",ngxListed:false,parent:"GTCO",status:"new"},
  {name:"CrusaderSterling Pensions",sector:"pension",subSector:"PFA",employees:348,hqCity:"Lagos",website:"crusaderpensions.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"NPF Pensions",sector:"pension",subSector:"PFA",employees:300,hqCity:"Abuja",website:"npfpensions.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"NLPC PFA",sector:"pension",subSector:"PFA",employees:250,hqCity:"Lagos",website:"nlpcpfa.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Fidelity Pension Managers",sector:"pension",subSector:"PFA",employees:250,hqCity:"Lagos",website:"fidelitypensionmanagers.com",ownership:"private",ngxListed:false,parent:"Fidelity Bank",status:"new"},
  {name:"Oak Pensions",sector:"pension",subSector:"PFA",employees:350,hqCity:"Lagos",website:"oakpensions.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"PAL Pensions (Pension Alliance)",sector:"pension",subSector:"PFA",employees:300,hqCity:"Lagos",website:"palpensions.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Tangerine APT Pensions",sector:"pension",subSector:"PFA",employees:250,hqCity:"Abuja",website:"tangerineapt.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"CardinalStone Pensions",sector:"pension",subSector:"PFA",employees:200,hqCity:"Lagos",website:"cardinalstonepensions.com",ownership:"private",ngxListed:false,parent:"CardinalStone",status:"new"},
  {name:"Citizens Pensions",sector:"pension",subSector:"PFA",employees:200,hqCity:"Lagos",website:"citizenspensions.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Norrenberger Pensions (IEI-Anchor)",sector:"pension",subSector:"PFA",employees:200,hqCity:"Abuja",website:"ieianchorpensions.com.ng",ownership:"private",ngxListed:false,parent:"Norrenberger Group",status:"new"},
  {name:"Radix Pension Managers",sector:"pension",subSector:"PFA",employees:200,hqCity:"Lagos",website:"radixpension.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Veritas Glanvills Pensions",sector:"pension",subSector:"PFA",employees:200,hqCity:"Lagos",website:"vgpensions.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"NUPEMCO",sector:"pension",subSector:"PFA (Universities)",employees:200,hqCity:"Abuja",website:"nupemco.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== INSURANCE (19) ==========
const INSURANCE = make('INS', [
  {name:"Leadway Assurance",sector:"insurance",subSector:"Composite",employees:1500,hqCity:"Lagos",website:"leadway.com",ownership:"private",ngxListed:false,parent:"Leadway Holdings",status:"new"},
  {name:"AIICO Insurance",sector:"insurance",subSector:"Composite",employees:800,hqCity:"Lagos",website:"aiicoinsurance.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"AXA Mansard Insurance",sector:"insurance",subSector:"Composite",employees:240,hqCity:"Lagos",website:"axamansard.com",ownership:"public",ngxListed:true,parent:"AXA Group",status:"new"},
  {name:"Custodian & Allied Insurance",sector:"insurance",subSector:"Composite",employees:600,hqCity:"Lagos",website:"custodianplc.com.ng",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"NEM Insurance",sector:"insurance",subSector:"Composite",employees:272,hqCity:"Lagos",website:"nem-insurance.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Coronation Insurance",sector:"insurance",subSector:"Composite",employees:350,hqCity:"Lagos",website:"coronationinsurance.com.ng",ownership:"public",ngxListed:true,parent:"Coronation Group",status:"new"},
  {name:"Cornerstone Insurance",sector:"insurance",subSector:"Composite",employees:281,hqCity:"Lagos",website:"cornerstone.com.ng",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Mutual Benefits Assurance",sector:"insurance",subSector:"Composite",employees:3000,hqCity:"Lagos",website:"mutualng.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Linkage Assurance",sector:"insurance",subSector:"General",employees:300,hqCity:"Lagos",website:"linkageassurance.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"LASACO Assurance",sector:"insurance",subSector:"Composite",employees:250,hqCity:"Lagos",website:"lasacoassurance.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Consolidated Hallmark Insurance",sector:"insurance",subSector:"General",employees:264,hqCity:"Lagos",website:"ch-insure.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Heirs Insurance",sector:"insurance",subSector:"General",employees:350,hqCity:"Lagos",website:"heirsinsurancegroup.com",ownership:"private",ngxListed:false,parent:"Heirs Holdings",status:"new"},
  {name:"SanlamAllianz Nigeria",sector:"insurance",subSector:"Composite",employees:800,hqCity:"Lagos",website:"sanlamallianz.com.ng",ownership:"private",ngxListed:false,parent:"Sanlam + Allianz JV",status:"new"},
  {name:"Old Mutual Nigeria",sector:"insurance",subSector:"General",employees:212,hqCity:"Lagos",website:"oldmutual.com",ownership:"private",ngxListed:false,parent:"Old Mutual (SA)",status:"new"},
  {name:"FBN Insurance",sector:"insurance",subSector:"Life",employees:350,hqCity:"Lagos",website:"fbninsurance.com",ownership:"private",ngxListed:false,parent:"FBN Holdings / Sanlam",status:"new"},
  {name:"Zenith General Insurance",sector:"insurance",subSector:"General",employees:233,hqCity:"Lagos",website:"zenithinsurance.com.ng",ownership:"private",ngxListed:false,parent:"Zenith Bank Group",status:"new"},
  {name:"Stanbic IBTC Insurance",sector:"insurance",subSector:"Life",employees:200,hqCity:"Lagos",website:"stanbicibtcinsurance.com",ownership:"private",ngxListed:false,parent:"Stanbic IBTC Holdings",status:"new"},
  {name:"Hygeia HMO",sector:"insurance",subSector:"Health Insurance (HMO)",employees:500,hqCity:"Lagos",website:"hygeiahmo.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Leadway Health (HMO)",sector:"insurance",subSector:"Health Insurance (HMO)",employees:300,hqCity:"Lagos",website:"leadwayhealth.com",ownership:"private",ngxListed:false,parent:"Leadway Holdings",status:"new"},
]);

// ========== PROFESSIONAL SERVICES (20) ==========
const PROF_SERVICES = make('PS', [
  {name:"PwC Nigeria",sector:"professional-services",subSector:"Audit / Advisory",employees:1500,hqCity:"Lagos",website:"pwc.com/ng",ownership:"private",ngxListed:false,parent:"PwC Global",status:"new"},
  {name:"Deloitte Nigeria",sector:"professional-services",subSector:"Audit / Advisory",employees:1200,hqCity:"Lagos",website:"deloitte.com/ng",ownership:"private",ngxListed:false,parent:"Deloitte Global",status:"new"},
  {name:"KPMG Nigeria",sector:"professional-services",subSector:"Audit / Advisory",employees:1000,hqCity:"Lagos",website:"kpmg.com/ng",ownership:"private",ngxListed:false,parent:"KPMG Global",status:"new"},
  {name:"EY Nigeria",sector:"professional-services",subSector:"Audit / Advisory",employees:800,hqCity:"Lagos",website:"ey.com/ng",ownership:"private",ngxListed:false,parent:"EY Global",status:"new"},
  {name:"Accenture Nigeria",sector:"professional-services",subSector:"Management Consulting / Tech",employees:500,hqCity:"Lagos",website:"accenture.com",ownership:"private",ngxListed:false,parent:"Accenture PLC",status:"new"},
  {name:"McKinsey & Company Lagos",sector:"professional-services",subSector:"Strategy Consulting",employees:200,hqCity:"Lagos",website:"mckinsey.com",ownership:"private",ngxListed:false,parent:"McKinsey & Co",status:"new"},
  {name:"BCG Lagos",sector:"professional-services",subSector:"Strategy Consulting",employees:200,hqCity:"Lagos",website:"bcg.com",ownership:"private",ngxListed:false,parent:"BCG",status:"new"},
  {name:"Phillips Consulting",sector:"professional-services",subSector:"HR / Management Consulting",employees:300,hqCity:"Lagos",website:"phillipsconsulting.net",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Andersen Nigeria",sector:"professional-services",subSector:"Tax / Legal",employees:250,hqCity:"Lagos",website:"ng.andersen.com",ownership:"private",ngxListed:false,parent:"Andersen Global",status:"new"},
  {name:"BDO Nigeria",sector:"professional-services",subSector:"Audit / Advisory",employees:300,hqCity:"Lagos",website:"bdo.com.ng",ownership:"private",ngxListed:false,parent:"BDO Global",status:"new"},
  {name:"Grant Thornton Nigeria",sector:"professional-services",subSector:"Audit / Advisory",employees:200,hqCity:"Lagos",website:"grantthornton.com.ng",ownership:"private",ngxListed:false,parent:"Grant Thornton Int'l",status:"new"},
  {name:"Aluko & Oyebode",sector:"professional-services",subSector:"Law Firm",employees:250,hqCity:"Lagos",website:"aluko-oyebode.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Banwo & Ighodalo",sector:"professional-services",subSector:"Law Firm",employees:200,hqCity:"Lagos",website:"banwo-ighodalo.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Templars Law",sector:"professional-services",subSector:"Law Firm",employees:200,hqCity:"Lagos",website:"templars-law.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Udo Udoma & Belo-Osagie",sector:"professional-services",subSector:"Law Firm",employees:200,hqCity:"Lagos",website:"uubo.org",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Workforce Group",sector:"professional-services",subSector:"HR Consulting / Outsourcing",employees:500,hqCity:"Lagos",website:"workforcegroup.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"SeamlessHR",sector:"professional-services",subSector:"HR Tech / SaaS",employees:300,hqCity:"Lagos",website:"seamlesshr.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Verraki Partners",sector:"professional-services",subSector:"Technology Consulting",employees:250,hqCity:"Lagos",website:"verraki.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Mazars Nigeria",sector:"professional-services",subSector:"Audit / Tax",employees:200,hqCity:"Lagos",website:"mazars.com.ng",ownership:"private",ngxListed:false,parent:"Mazars Global",status:"new"},
  {name:"Novarick Homes & Properties",sector:"professional-services",subSector:"Real Estate Advisory",employees:200,hqCity:"Lagos",website:"novarickhomes.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== LOGISTICS & TRANSPORT (10) ==========
const LOGISTICS = make('LOG', [
  {name:"GIG Logistics (GIGL)",sector:"logistics",subSector:"Courier / Express",employees:1300,hqCity:"Lagos",website:"giglogistics.com",ownership:"private",ngxListed:false,parent:"GIG Group",status:"new"},
  {name:"Red Star Express",sector:"logistics",subSector:"Courier (FedEx Licensee)",employees:1900,hqCity:"Lagos",website:"redstarexpress.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"ABC Transport",sector:"logistics",subSector:"Road Passenger / Cargo",employees:1117,hqCity:"Lagos",website:"abctransport.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"DHL Nigeria",sector:"logistics",subSector:"International Express",employees:800,hqCity:"Lagos",website:"dhl.com/ng",ownership:"private",ngxListed:false,parent:"DHL / Deutsche Post",status:"new"},
  {name:"Maersk Nigeria",sector:"logistics",subSector:"Shipping / Container",employees:500,hqCity:"Lagos",website:"maersk.com",ownership:"private",ngxListed:false,parent:"A.P. Moller-Maersk",status:"new"},
  {name:"APM Terminals Apapa",sector:"logistics",subSector:"Port / Container Terminal",employees:1500,hqCity:"Lagos",website:"apmterminals.com",ownership:"private",ngxListed:false,parent:"A.P. Moller-Maersk",status:"new"},
  {name:"Dangote Transport",sector:"logistics",subSector:"Haulage / Fleet",employees:3000,hqCity:"Lagos",website:"dangote.com",ownership:"private",ngxListed:false,parent:"Dangote Group",status:"new"},
  {name:"Bolloré Transport & Logistics Nigeria",sector:"logistics",subSector:"Port / Freight",employees:800,hqCity:"Lagos",website:"bollore-transport-logistics.com",ownership:"private",ngxListed:false,parent:"Bolloré Group",status:"new"},
  {name:"Max.ng",sector:"logistics",subSector:"Last-Mile / Mobility",employees:500,hqCity:"Lagos",website:"max.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Kobo360 (Kobo)",sector:"logistics",subSector:"Trucking / Freight Tech",employees:300,hqCity:"Lagos",website:"kobo360.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== MEDIA & ENTERTAINMENT (8) ==========
const MEDIA = make('MED', [
  {name:"MultiChoice Nigeria (DStv/GOtv)",sector:"media",subSector:"Pay TV / Broadcasting",employees:2000,hqCity:"Lagos",website:"multichoice.com/ng",ownership:"private",ngxListed:false,parent:"MultiChoice Group (SA)",status:"new"},
  {name:"Channels Television",sector:"media",subSector:"Television Broadcasting",employees:400,hqCity:"Lagos",website:"channelstv.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"AIT / Daar Communications",sector:"media",subSector:"Television Broadcasting",employees:500,hqCity:"Abuja",website:"daar.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Arise TV / THISDAY Group",sector:"media",subSector:"Newspaper / Television",employees:500,hqCity:"Lagos",website:"thisdaylive.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Silverbird Group",sector:"media",subSector:"Media / Cinema",employees:300,hqCity:"Lagos",website:"silverbirdgroup.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Filmhouse Cinemas",sector:"media",subSector:"Cinema Exhibition",employees:500,hqCity:"Lagos",website:"filmhouseng.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"IROKOtv",sector:"media",subSector:"Streaming / Digital Content",employees:200,hqCity:"Lagos",website:"irokotv.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"TVC Communications",sector:"media",subSector:"Television Broadcasting",employees:300,hqCity:"Lagos",website:"tvcnews.tv",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== POWER & UTILITIES (10) ==========
const POWER = make('PWR', [
  {name:"Ikeja Electric",sector:"conglomerates",subSector:"Electricity Distribution (DISCO)",employees:2782,hqCity:"Lagos",website:"ikejaelectric.com",ownership:"private",ngxListed:false,parent:"Sahara Group",status:"new"},
  {name:"Eko Electricity Distribution",sector:"conglomerates",subSector:"Electricity Distribution (DISCO)",employees:2500,hqCity:"Lagos",website:"ekedp.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Abuja Electricity Distribution",sector:"conglomerates",subSector:"Electricity Distribution (DISCO)",employees:3000,hqCity:"Abuja",website:"abujaelectricity.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Egbin Power",sector:"conglomerates",subSector:"Power Generation",employees:800,hqCity:"Lagos",website:"egbin-power.com",ownership:"private",ngxListed:false,parent:"Sahara Group",status:"new"},
  {name:"Transcorp Power",sector:"conglomerates",subSector:"Power Generation",employees:600,hqCity:"Abuja",website:"transcorppower.com",ownership:"public",ngxListed:true,parent:"Transcorp PLC",status:"new"},
  {name:"Geregu Power",sector:"conglomerates",subSector:"Power Generation",employees:300,hqCity:"Lagos",website:"geregupowerplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
]);

// ========== HEALTHCARE (8) ==========
const HEALTHCARE = make('HC', [
  {name:"Reddington Hospital",sector:"healthcare",subSector:"Multi-Specialty Hospital",employees:500,hqCity:"Lagos",website:"reddingtonhospital.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Lagoon Hospitals (IHVN)",sector:"healthcare",subSector:"Multi-Specialty Hospital",employees:400,hqCity:"Lagos",website:"lagoonhospitals.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"EHA Clinics",sector:"healthcare",subSector:"Primary / Specialist Care",employees:300,hqCity:"Abuja",website:"ehaclinics.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Hygeia HMO (see Insurance)",sector:"healthcare",subSector:"Health Insurance (HMO)",employees:500,hqCity:"Lagos",website:"hygeiahmo.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Paelon Memorial Clinic",sector:"healthcare",subSector:"Multi-Specialty Hospital",employees:200,hqCity:"Lagos",website:"paelonmemorial.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"St. Nicholas Hospital",sector:"healthcare",subSector:"Multi-Specialty Hospital",employees:300,hqCity:"Lagos",website:"saintnicholashospital.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"First Cardiology Consultants",sector:"healthcare",subSector:"Specialist Hospital (Cardiology)",employees:200,hqCity:"Lagos",website:"firstcardiology.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Mecure Healthcare (Babcock University Teaching Hospital)",sector:"healthcare",subSector:"Teaching Hospital",employees:300,hqCity:"Lagos",website:"mecurehealthcare.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== EDUCATION (6) ==========
const EDUCATION = make('EDU', [
  {name:"Pan-Atlantic University / LBS",sector:"education",subSector:"Private University / Business School",employees:500,hqCity:"Lagos",website:"pau.edu.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Covenant University",sector:"education",subSector:"Private University",employees:1000,hqCity:"Lagos",website:"covenantuniversity.edu.ng",ownership:"private",ngxListed:false,parent:"Living Faith Church",status:"new"},
  {name:"Babcock University",sector:"education",subSector:"Private University",employees:800,hqCity:"Lagos",website:"babcock.edu.ng",ownership:"private",ngxListed:false,parent:"SDA Church",status:"new"},
  {name:"American University of Nigeria (AUN)",sector:"education",subSector:"Private University",employees:600,hqCity:"Yola",website:"aun.edu.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Andela Nigeria",sector:"education",subSector:"Tech Talent / Training",employees:500,hqCity:"Lagos",website:"andela.com",ownership:"private",ngxListed:false,parent:"Andela Inc",status:"new"},
  {name:"Decagon Institute",sector:"education",subSector:"Tech Training / Software Engineering",employees:200,hqCity:"Lagos",website:"decagonhq.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== REAL ESTATE & CONSTRUCTION (15) ==========
const REAL_ESTATE = make('RE', [
  {name:"CCECC Nigeria",sector:"real-estate",subSector:"Construction / Infrastructure (Rail/Roads)",employees:5000,hqCity:"Abuja",website:"ccecc.com.ng",ownership:"private",ngxListed:false,parent:"CRCC (China)",status:"new"},
  {name:"Arab Contractors Nigeria",sector:"real-estate",subSector:"Construction / Infrastructure",employees:1000,hqCity:"Lagos",website:"arabcont.com",ownership:"private",ngxListed:false,parent:"Arab Contractors (Egypt)",status:"new"},
  {name:"Reynolds Construction (RCC)",sector:"real-estate",subSector:"Construction / Civil Engineering",employees:2000,hqCity:"Abuja",website:"rccnigeria.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Setraco Nigeria",sector:"real-estate",subSector:"Construction / Roads",employees:1500,hqCity:"Abuja",website:"setraco-ng.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Costain West Africa",sector:"real-estate",subSector:"Construction / Engineering",employees:300,hqCity:"Lagos",website:"costain-wa.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"UPDC PLC",sector:"real-estate",subSector:"Real Estate Development",employees:300,hqCity:"Lagos",website:"updcplc.com",ownership:"public",ngxListed:true,parent:"UAC of Nigeria",status:"new"},
  {name:"Mixta Africa",sector:"real-estate",subSector:"Real Estate / Housing",employees:400,hqCity:"Lagos",website:"mixtaafrica.com",ownership:"private",ngxListed:false,parent:"ARM Group",status:"new"},
  {name:"Brains & Hammers",sector:"real-estate",subSector:"Real Estate Development",employees:500,hqCity:"Abuja",website:"brainsandhammers.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Landmark Africa Group",sector:"real-estate",subSector:"Mixed-Use Development",employees:300,hqCity:"Lagos",website:"landmarkafrica.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"RevolutionPlus Property",sector:"real-estate",subSector:"Real Estate Development",employees:300,hqCity:"Lagos",website:"revolutionplus.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Cappa & D'Alberto",sector:"real-estate",subSector:"Construction / Facilities",employees:500,hqCity:"Lagos",website:"capdal.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"HFP Engineering",sector:"real-estate",subSector:"Engineering / Construction",employees:400,hqCity:"Lagos",website:"hfpng.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Dutum Group",sector:"real-estate",subSector:"Construction / Real Estate",employees:400,hqCity:"Abuja",website:"dutumgroup.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Palton Morgan Holdings",sector:"real-estate",subSector:"Real Estate Investment",employees:250,hqCity:"Lagos",website:"paltonmorgan.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Craneburg Construction",sector:"real-estate",subSector:"Construction / Infrastructure",employees:300,hqCity:"Lagos",website:"craneburg.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== AGRICULTURE (10) ==========
const AGRICULTURE = make('AG', [
  {name:"Okomu Oil Palm",sector:"conglomerates",subSector:"Oil Palm Plantations",employees:3500,hqCity:"Lagos",website:"okomunigeria.com",ownership:"public",ngxListed:true,parent:"Socfin Group",status:"new"},
  {name:"Presco PLC",sector:"conglomerates",subSector:"Oil Palm Processing",employees:3000,hqCity:"Lagos",website:"presco-plc.com",ownership:"public",ngxListed:true,parent:"Siat NV (Belgium)",status:"new"},
  {name:"FTN Cocoa Processors",sector:"conglomerates",subSector:"Cocoa Processing",employees:250,hqCity:"Lagos",website:"ftncocoa.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Livestock Feeds PLC",sector:"conglomerates",subSector:"Animal Feed",employees:200,hqCity:"Lagos",website:"livestockfeedsplc.com",ownership:"public",ngxListed:true,parent:"UAC of Nigeria",status:"new"},
  {name:"Dansa Foods (Dangote Agro)",sector:"conglomerates",subSector:"Integrated Farming / Dairy",employees:1000,hqCity:"Lagos",website:"dangote.com",ownership:"private",ngxListed:false,parent:"Dangote Group",status:"new"},
  {name:"Wacot Limited",sector:"conglomerates",subSector:"Agri-Trading / Rice",employees:500,hqCity:"Lagos",website:"wacot.com",ownership:"private",ngxListed:false,parent:"TGI Group",status:"new"},
  {name:"Olam Nigeria (Olam Agri)",sector:"conglomerates",subSector:"Agri-Business / Food",employees:2500,hqCity:"Lagos",website:"olamgroup.com",ownership:"private",ngxListed:false,parent:"Olam Group (Singapore)",status:"new"},
  {name:"Syngenta Nigeria",sector:"conglomerates",subSector:"Agrochemicals / Seeds",employees:300,hqCity:"Lagos",website:"syngenta.com",ownership:"private",ngxListed:false,parent:"Syngenta Group",status:"new"},
  {name:"Animal Care Services (ACSK)",sector:"conglomerates",subSector:"Veterinary Services",employees:300,hqCity:"Lagos",website:"animalcareng.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Ellah Lakes PLC",sector:"conglomerates",subSector:"Oil Palm Plantation",employees:200,hqCity:"Lagos",website:"ellahlakes.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
]);

// ========== ADDITIONAL CONSUMER GOODS (15) ==========
const CONSUMER2 = make('CG2', [
  {name:"Guinness Nigeria (Tolaram)",sector:"consumer-goods",subSector:"Beverages",employees:1200,hqCity:"Lagos",website:"guinness-nigeria.com",ownership:"public",ngxListed:true,parent:"Tolaram Group",status:"new"},
  {name:"International Breweries (ABInBev)",sector:"consumer-goods",subSector:"Beverages",employees:2000,hqCity:"Lagos",website:"intbreweries.com",ownership:"public",ngxListed:true,parent:"ABInBev",status:"new"},
  {name:"Honeywell Flour Mills",sector:"consumer-goods",subSector:"Food Processing",employees:1200,hqCity:"Lagos",website:"honeywellflour.com",ownership:"private",ngxListed:false,parent:"Flour Mills of Nigeria",status:"new"},
  {name:"Dufil Prima Foods (Indomie)",sector:"consumer-goods",subSector:"Instant Noodles / Food",employees:5000,hqCity:"Lagos",website:"dufil.com",ownership:"private",ngxListed:false,parent:"Tolaram/Salim Group",status:"new"},
  {name:"FrieslandCampina WAMCO",sector:"consumer-goods",subSector:"Dairy (Peak Milk)",employees:1200,hqCity:"Lagos",website:"frieslandcampina.com.ng",ownership:"private",ngxListed:false,parent:"FrieslandCampina (Netherlands)",status:"new"},
  {name:"Promasidor Nigeria",sector:"consumer-goods",subSector:"Dairy / Beverages (Cowbell)",employees:1500,hqCity:"Lagos",website:"promasidor.com",ownership:"private",ngxListed:false,parent:"Promasidor Holdings",status:"new"},
  {name:"CHI Limited (Chivita/Hollandia)",sector:"consumer-goods",subSector:"Beverages / Snacks",employees:2000,hqCity:"Lagos",website:"chi.com.ng",ownership:"private",ngxListed:false,parent:"TGI Group / Coca-Cola",status:"new"},
  {name:"TGI Group",sector:"consumer-goods",subSector:"Diversified FMCG Holdings",employees:5000,hqCity:"Lagos",website:"tgigroup.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Tolaram Group Nigeria",sector:"consumer-goods",subSector:"Diversified FMCG",employees:5000,hqCity:"Lagos",website:"tolaram.com",ownership:"private",ngxListed:false,parent:"Tolaram (Singapore)",status:"new"},
  {name:"Multipro Consumer Products",sector:"consumer-goods",subSector:"FMCG Distribution",employees:2000,hqCity:"Lagos",website:"multipro.com.ng",ownership:"private",ngxListed:false,parent:"Tolaram Group",status:"new"},
  {name:"BUA Foods PLC",sector:"consumer-goods",subSector:"Food Processing",employees:3000,hqCity:"Lagos",website:"buafoods.com",ownership:"public",ngxListed:true,parent:"BUA Group",status:"new"},
  {name:"NASCON Allied Industries",sector:"consumer-goods",subSector:"Salt / Seasoning",employees:700,hqCity:"Lagos",website:"nasconplc.com",ownership:"public",ngxListed:true,parent:"Dangote Group",status:"new"},
  {name:"Vitafoam Nigeria",sector:"consumer-goods",subSector:"Foam / Mattresses",employees:666,hqCity:"Lagos",website:"vitafoamnig.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Tiger Brands Nigeria",sector:"consumer-goods",subSector:"Food Processing (Flour)",employees:600,hqCity:"Lagos",website:"tigerbrands.com",ownership:"private",ngxListed:false,parent:"Tiger Brands (SA)",status:"new"},
  {name:"Beloxxi Industries",sector:"consumer-goods",subSector:"Biscuits / Snacks",employees:1000,hqCity:"Lagos",website:"beloxxi.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== ADDITIONAL FINTECHS & STARTUPS (30) ==========
const STARTUPS = make('ST', [
  {name:"Helium Health",sector:"fintech",subSector:"HealthTech / Hospital SaaS",employees:250,hqCity:"Lagos",website:"heliumhealth.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"uLesson Education",sector:"fintech",subSector:"EdTech / K-12 Learning",employees:200,hqCity:"Lagos",website:"ulesson.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Farmcrowdy",sector:"fintech",subSector:"AgriTech / Farm Investment",employees:200,hqCity:"Lagos",website:"farmcrowdy.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Thrive Agric",sector:"fintech",subSector:"AgriTech / Farm Finance",employees:300,hqCity:"Abuja",website:"thriveagric.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Releaf",sector:"fintech",subSector:"AgriTech / Processing",employees:200,hqCity:"Lagos",website:"releaf.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Shuttlers",sector:"fintech",subSector:"Mobility / Shared Transport",employees:200,hqCity:"Lagos",website:"shuttlers.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Treepz (formerly Plentywaka)",sector:"fintech",subSector:"Mobility / Shared Transport",employees:200,hqCity:"Lagos",website:"treepz.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Mono",sector:"fintech",subSector:"SaaS / Open Banking API",employees:200,hqCity:"Lagos",website:"mono.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Prospa",sector:"fintech",subSector:"SaaS / Business Banking",employees:200,hqCity:"Lagos",website:"getprospa.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Sabi",sector:"fintech",subSector:"B2B Commerce / Supply Chain",employees:300,hqCity:"Lagos",website:"sabi.am",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"TradeDepot",sector:"fintech",subSector:"B2B Commerce / Distribution",employees:500,hqCity:"Lagos",website:"tradedepot.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Alerzo",sector:"fintech",subSector:"B2B Commerce / FMCG Distribution",employees:800,hqCity:"Lagos",website:"alerzo.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Curacel",sector:"fintech",subSector:"InsurTech / AI Claims",employees:200,hqCity:"Lagos",website:"curacel.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Casava Microinsurance",sector:"fintech",subSector:"InsurTech / Micro Insurance",employees:200,hqCity:"Lagos",website:"casava.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Arnergy",sector:"fintech",subSector:"CleanTech / Solar Energy",employees:300,hqCity:"Lagos",website:"arnergy.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Daystar Power",sector:"fintech",subSector:"CleanTech / Solar C&I",employees:400,hqCity:"Lagos",website:"daystarpower.com",ownership:"private",ngxListed:false,parent:"Shell (acquired)",status:"new"},
  {name:"Lumos Nigeria",sector:"fintech",subSector:"CleanTech / Solar Home Systems",employees:300,hqCity:"Lagos",website:"lumos.com.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Rensource Energy",sector:"fintech",subSector:"CleanTech / Distributed Solar",employees:200,hqCity:"Lagos",website:"rensource.energy",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Jumia Nigeria",sector:"fintech",subSector:"E-Commerce / Marketplace",employees:1000,hqCity:"Lagos",website:"jumia.com.ng",ownership:"public",ngxListed:false,parent:"Jumia Technologies (NYSE)",status:"new"},
  {name:"Konga",sector:"fintech",subSector:"E-Commerce / Retail",employees:500,hqCity:"Lagos",website:"konga.com",ownership:"private",ngxListed:false,parent:"Zinox Group",status:"new"},
  {name:"Buypower",sector:"fintech",subSector:"UtilityTech / Bill Payments",employees:200,hqCity:"Lagos",website:"buypower.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Bento Africa (Workpay Nigeria)",sector:"fintech",subSector:"HR Tech / Payroll",employees:200,hqCity:"Lagos",website:"bento.africa",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Semicolon Africa",sector:"fintech",subSector:"EdTech / Software Training",employees:200,hqCity:"Lagos",website:"semicolon.africa",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"AltSchool Africa",sector:"fintech",subSector:"EdTech / Tech Education",employees:200,hqCity:"Lagos",website:"altschoolafrica.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Spleet",sector:"fintech",subSector:"PropTech / Rent Solutions",employees:200,hqCity:"Lagos",website:"spleet.africa",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Sendbox",sector:"fintech",subSector:"Logistics Tech / Shipping API",employees:200,hqCity:"Lagos",website:"sendbox.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Kwik Delivery",sector:"fintech",subSector:"Logistics Tech / Same-Day Delivery",employees:300,hqCity:"Lagos",website:"kwik.delivery",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Bloc",sector:"fintech",subSector:"SaaS / Banking-as-a-Service",employees:200,hqCity:"Lagos",website:"blochq.io",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"OnePipe",sector:"fintech",subSector:"SaaS / API Banking",employees:200,hqCity:"Lagos",website:"onepipe.io",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Patricia Technologies",sector:"fintech",subSector:"Crypto / Digital Assets",employees:200,hqCity:"Lagos",website:"mypatricia.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== ADDITIONAL OIL & GAS SERVICES (10) ==========
const OIL_GAS2 = make('OG2', [
  {name:"Weatherford Nigeria",sector:"oil-gas",subSector:"Oilfield Services",employees:500,hqCity:"Lagos",website:"weatherford.com",ownership:"private",ngxListed:false,parent:"Weatherford Int'l",status:"new"},
  {name:"Wood Group Nigeria",sector:"oil-gas",subSector:"Engineering Services",employees:600,hqCity:"Lagos",website:"woodplc.com",ownership:"private",ngxListed:false,parent:"John Wood Group (UK)",status:"new"},
  {name:"NNPC E&P Limited",sector:"oil-gas",subSector:"E&P (NOC subsidiary)",employees:800,hqCity:"Abuja",website:"nnpcgroup.com",ownership:"government",ngxListed:false,parent:"NNPC Limited",status:"new"},
  {name:"NNPC Retail Limited",sector:"oil-gas",subSector:"Downstream Retail",employees:1200,hqCity:"Abuja",website:"nnpcgroup.com",ownership:"government",ngxListed:false,parent:"NNPC Limited",status:"new"},
  {name:"Shoreline Natural Resources",sector:"oil-gas",subSector:"E&P (Indigenous)",employees:300,hqCity:"Lagos",website:"shorelinenrl.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Neconde Energy",sector:"oil-gas",subSector:"E&P (Indigenous)",employees:250,hqCity:"Lagos",website:"neconde.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Waltersmith Petroman",sector:"oil-gas",subSector:"E&P / Modular Refining",employees:400,hqCity:"Lagos",website:"waltersmithng.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Renaissance Africa Energy",sector:"oil-gas",subSector:"E&P (Indigenous)",employees:500,hqCity:"Lagos",website:"renaissanceafrica.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Pillar Oil Limited",sector:"oil-gas",subSector:"E&P (Indigenous)",employees:250,hqCity:"Lagos",website:"pillaroil.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Lekoil Nigeria",sector:"oil-gas",subSector:"E&P",employees:200,hqCity:"Lagos",website:"lekoil.com",ownership:"public",ngxListed:false,parent:null,status:"new"},
]);

// ========== ADDITIONAL PROFESSIONAL SERVICES (10) ==========
const PROF2 = make('PS2', [
  {name:"Olaniwun Ajayi LP",sector:"professional-services",subSector:"Law Firm",employees:250,hqCity:"Lagos",website:"olaniwunajayi.net",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"G. Elias & Co",sector:"professional-services",subSector:"Law Firm",employees:200,hqCity:"Lagos",website:"gelias.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Jackson Etti & Edu",sector:"professional-services",subSector:"Law Firm",employees:200,hqCity:"Lagos",website:"jee.africa",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Dentons ACAS-Law",sector:"professional-services",subSector:"Law Firm (International)",employees:200,hqCity:"Lagos",website:"dentons.com",ownership:"private",ngxListed:false,parent:"Dentons",status:"new"},
  {name:"SPA Ajibade & Co",sector:"professional-services",subSector:"Law Firm",employees:200,hqCity:"Lagos",website:"spaajibade.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"AELEX",sector:"professional-services",subSector:"Law Firm",employees:200,hqCity:"Lagos",website:"aelex.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Strachan Partners",sector:"professional-services",subSector:"Law Firm",employees:200,hqCity:"Lagos",website:"strachanpartners.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Pedabo (Baker Tilly Nigeria)",sector:"professional-services",subSector:"Audit / Tax",employees:200,hqCity:"Lagos",website:"pedabo.com",ownership:"private",ngxListed:false,parent:"Baker Tilly Int'l",status:"new"},
  {name:"Novarick Partners",sector:"professional-services",subSector:"Management Consulting",employees:200,hqCity:"Lagos",website:"novarickpartners.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Alpha Morgan Capital",sector:"professional-services",subSector:"Investment Banking",employees:200,hqCity:"Lagos",website:"alphamorgancapital.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== ADDITIONAL HEALTHCARE (8) ==========
const HEALTH2 = make('HC2', [
  {name:"Evans Medical PLC",sector:"healthcare",subSector:"Pharmaceutical Manufacturing",employees:300,hqCity:"Lagos",website:"evansmedicalplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Neimeth International Pharma",sector:"healthcare",subSector:"Pharmaceutical Manufacturing",employees:300,hqCity:"Lagos",website:"neimethplc.com",ownership:"public",ngxListed:true,parent:null,status:"new"},
  {name:"Drugfield Pharmaceuticals",sector:"healthcare",subSector:"Pharmaceutical Manufacturing",employees:400,hqCity:"Lagos",website:"drugfieldpharma.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Shalina Healthcare Nigeria",sector:"healthcare",subSector:"Pharmaceutical Distribution",employees:400,hqCity:"Lagos",website:"sfrgroup.com",ownership:"private",ngxListed:false,parent:"SFR Group (Dubai)",status:"new"},
  {name:"Clearline HMO",sector:"healthcare",subSector:"Health Insurance (HMO)",employees:250,hqCity:"Lagos",website:"clearlinehmo.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Redcare HMO",sector:"healthcare",subSector:"Health Insurance (HMO)",employees:250,hqCity:"Lagos",website:"redcarehmo.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"AXA Mansard Health",sector:"healthcare",subSector:"Health Insurance (HMO)",employees:400,hqCity:"Lagos",website:"axamansard.com",ownership:"private",ngxListed:false,parent:"AXA Group",status:"new"},
  {name:"Mecure Healthcare",sector:"healthcare",subSector:"Hospital / Teaching",employees:300,hqCity:"Lagos",website:"mecurehealthcare.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== ADDITIONAL EDUCATION (6) ==========
const EDU2 = make('EDU2', [
  {name:"Afe Babalola University (ABUAD)",sector:"education",subSector:"Private University",employees:1500,hqCity:"Ado-Ekiti",website:"abuad.edu.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Bowen University",sector:"education",subSector:"Private University",employees:800,hqCity:"Iwo",website:"bowen.edu.ng",ownership:"private",ngxListed:false,parent:"Nigerian Baptist Convention",status:"new"},
  {name:"Landmark University",sector:"education",subSector:"Private University",employees:800,hqCity:"Omu-Aran",website:"lmu.edu.ng",ownership:"private",ngxListed:false,parent:"Living Faith Church",status:"new"},
  {name:"Redeemer's University",sector:"education",subSector:"Private University",employees:600,hqCity:"Ede",website:"run.edu.ng",ownership:"private",ngxListed:false,parent:"RCCG",status:"new"},
  {name:"NIIT Nigeria (Fortesoft)",sector:"education",subSector:"IT Training",employees:300,hqCity:"Lagos",website:"niitfortesoft.com",ownership:"private",ngxListed:false,parent:"NIIT (India)",status:"new"},
  {name:"Semicolon Africa",sector:"education",subSector:"Software Engineering Training",employees:200,hqCity:"Lagos",website:"semicolon.africa",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// ========== ADDITIONAL GOVERNMENT (5) ==========
const GOV2 = make('GOV2', [
  {name:"Nigerian Army",sector:"government",subSector:"Military (Land Forces)",employees:130000,hqCity:"Abuja",website:"army.mil.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"Nigerian Navy",sector:"government",subSector:"Military (Naval Forces)",employees:25000,hqCity:"Abuja",website:"navy.mil.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"Nigerian Air Force",sector:"government",subSector:"Military (Air Forces)",employees:18000,hqCity:"Abuja",website:"airforce.mil.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NUPRC",sector:"government",subSector:"Upstream Petroleum Regulation",employees:500,hqCity:"Abuja",website:"nuprc.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
  {name:"NMDPRA",sector:"government",subSector:"Downstream Petroleum Regulation",employees:500,hqCity:"Abuja",website:"nmdpra.gov.ng",ownership:"government",ngxListed:false,parent:null,status:"new"},
]);

// ========== NIGERIAN STARTUPS GAINING TRACTION (50) ==========
const STARTUPS2 = make('SU', [
  {name:"Chowdeck",sector:"fintech",subSector:"Food Delivery / Quick Commerce",employees:200,hqCity:"Lagos",website:"chowdeck.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Moove",sector:"fintech",subSector:"Vehicle Financing / Mobility",employees:3000,hqCity:"Lagos",website:"moove.io",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Spiro",sector:"fintech",subSector:"EV Motorcycles / Battery Swap",employees:500,hqCity:"Lagos",website:"spiro.bike",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Terra Industries",sector:"fintech",subSector:"DeepTech / Defence Systems",employees:200,hqCity:"Abuja",website:"terraindustries.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"OmniRetail",sector:"fintech",subSector:"B2B Commerce / FMCG Distribution",employees:200,hqCity:"Lagos",website:"omniretail.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Reliance Health (RelianceHMO)",sector:"healthcare",subSector:"Digital Health Insurance",employees:200,hqCity:"Lagos",website:"getreliancehealth.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Remedial Health",sector:"healthcare",subSector:"Pharma Supply Chain Tech",employees:200,hqCity:"Lagos",website:"remedialhealth.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"DrugStoc",sector:"healthcare",subSector:"B2B Pharma Marketplace",employees:200,hqCity:"Lagos",website:"drugstoc.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Autochek",sector:"fintech",subSector:"Automotive Tech / Vehicle Finance",employees:200,hqCity:"Lagos",website:"autochek.africa",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Termii",sector:"fintech",subSector:"Communications SaaS / OTP Infrastructure",employees:200,hqCity:"Lagos",website:"termii.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Kippa",sector:"fintech",subSector:"SME Bookkeeping / Digital Payments",employees:200,hqCity:"Lagos",website:"kippa.africa",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"PaidHR",sector:"fintech",subSector:"HR Tech / Payroll Automation",employees:200,hqCity:"Lagos",website:"paidhr.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Raenest",sector:"fintech",subSector:"Remote Worker Payments / Multi-Currency",employees:200,hqCity:"Lagos",website:"raenest.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"HumanManager",sector:"fintech",subSector:"HR Tech / Enterprise HR SaaS",employees:200,hqCity:"Lagos",website:"humanmanager.net",ownership:"private",ngxListed:false,parent:"SystemSpecs",status:"new"},
  {name:"Babban Gona",sector:"fintech",subSector:"AgriTech / Smallholder Farming",employees:200,hqCity:"Lagos",website:"babbangona.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Hello Tractor",sector:"fintech",subSector:"AgriTech / Tractor-as-a-Service",employees:200,hqCity:"Abuja",website:"hellotractor.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Crop2Cash",sector:"fintech",subSector:"AgriTech / Farmer Financial Inclusion",employees:200,hqCity:"Lagos",website:"crop2cash.com.ng",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Vendease",sector:"fintech",subSector:"B2B Food Supply Marketplace",employees:200,hqCity:"Lagos",website:"vendease.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Bumpa",sector:"fintech",subSector:"E-Commerce Management SaaS",employees:200,hqCity:"Lagos",website:"getbumpa.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Quidax",sector:"fintech",subSector:"Crypto Exchange",employees:200,hqCity:"Lagos",website:"quidax.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Rivy (PayHippo)",sector:"fintech",subSector:"CleanTech / Solar Financing",employees:200,hqCity:"Lagos",website:"rivy.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"MyCoverGenius",sector:"fintech",subSector:"InsurTech / Embedded Insurance API",employees:200,hqCity:"Lagos",website:"mycovergenius.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"ETAP Insurance",sector:"fintech",subSector:"InsurTech / Usage-Based Motor Insurance",employees:200,hqCity:"Lagos",website:"etap.insure",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Spleet",sector:"fintech",subSector:"PropTech / Subscription Rent",employees:200,hqCity:"Lagos",website:"spleet.africa",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"SmallSmall (RentSmallSmall)",sector:"fintech",subSector:"PropTech / Rent-to-Own",employees:200,hqCity:"Lagos",website:"smallsmall.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Estate Intel",sector:"fintech",subSector:"PropTech / Real Estate Data Analytics",employees:200,hqCity:"Lagos",website:"estateintel.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Stears",sector:"fintech",subSector:"Data Intelligence / Africa Analytics",employees:200,hqCity:"Lagos",website:"stears.co",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"mPharma Nigeria",sector:"healthcare",subSector:"Pharma Distribution Platform",employees:200,hqCity:"Lagos",website:"mpharma.com",ownership:"private",ngxListed:false,parent:"mPharma (Ghana)",status:"new"},
  {name:"WellaHealth",sector:"healthcare",subSector:"Embedded Healthcare / Micro-Insurance",employees:200,hqCity:"Lagos",website:"wellahealth.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"10mg Health",sector:"healthcare",subSector:"Healthcare Financing",employees:200,hqCity:"Lagos",website:"10mg.health",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Utiva",sector:"education",subSector:"EdTech / Tech Skills Training",employees:200,hqCity:"Lagos",website:"utiva.io",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"AltSchool Africa",sector:"education",subSector:"EdTech / Tech Education",employees:200,hqCity:"Lagos",website:"altschoolafrica.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"uLesson Education",sector:"education",subSector:"EdTech / K-12 Learning",employees:200,hqCity:"Lagos",website:"ulesson.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Roqqu",sector:"fintech",subSector:"Crypto Exchange / Cross-Border",employees:200,hqCity:"Lagos",website:"roqqu.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Accrue",sector:"fintech",subSector:"Crypto Investment Platform",employees:200,hqCity:"Lagos",website:"accrue.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Bani",sector:"fintech",subSector:"Cross-Border Payments Infrastructure",employees:200,hqCity:"Lagos",website:"banipayhq.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Lifestores Healthcare",sector:"healthcare",subSector:"Pharma Aggregation / Dispensary SaaS",employees:200,hqCity:"Lagos",website:"lifestoreshealthcare.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"AgroMall",sector:"fintech",subSector:"AgriTech / Agri-Finance",employees:200,hqCity:"Lagos",website:"agromall.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Terawork",sector:"fintech",subSector:"HR Tech / Freelance Marketplace",employees:200,hqCity:"Lagos",website:"terawork.com",ownership:"private",ngxListed:false,parent:null,status:"new"},
  {name:"Bento Africa",sector:"fintech",subSector:"HR Tech / Payroll SaaS",employees:200,hqCity:"Lagos",website:"bento.africa",ownership:"private",ngxListed:false,parent:null,status:"new"},
]);

// Combine all
const COMPANIES = [
  ...BANKING, ...GOVERNMENT, ...GOV2, ...OIL_GAS, ...OIL_GAS2,
  ...CONGLOMERATES, ...TELECOMS, ...CONSUMER, ...CONSUMER2,
  ...FINTECH, ...STARTUPS, ...STARTUPS2, ...PENSION, ...INSURANCE,
  ...PROF_SERVICES, ...PROF2, ...LOGISTICS, ...MEDIA,
  ...POWER, ...HEALTHCARE, ...HEALTH2, ...EDUCATION, ...EDU2,
  ...REAL_ESTATE, ...AGRICULTURE
];

// Deduplicate by name (keep first occurrence)
const seen = new Set();
const DEDUPED = COMPANIES.filter(c => {
  if (seen.has(c.name)) return false;
  seen.add(c.name);
  return true;
});

export default DEDUPED;
export const TOTAL = DEDUPED.length;
export const BY_SECTOR = DEDUPED.reduce((acc, c) => { acc[c.sector] = (acc[c.sector] || 0) + 1; return acc; }, {});
export const HOT_COUNT = DEDUPED.filter(c => c.tier === 'hot').length;
export const CLIENTS = DEDUPED.filter(c => c.status === 'client').length;
