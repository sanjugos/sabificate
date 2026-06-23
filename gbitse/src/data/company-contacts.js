// Company contact info scraped from websites — 2026-05-30
// Keyed by company name for lookup

const COMPANY_CONTACTS = {
  "Access Bank": { phone: "0201 280 2500", phone2: "07003000000", careers: "careers.accessbankplc.com" },
  "Fidelity Bank": { email: "trueserve@fidelitybank.ng", phone: "0700 343 35489" },
  "Sterling Bank": { email: "customercare@sterling.ng", address: "20 Marina, Lagos" },
  "Dangote Group": { email: "communications@dangote.com", phone: "+234 1 448 0815", ir: "ir@dangote.com", media: "media@dangote.com", partnerships: "partnerships@dangote.com", address: "Leadway Marble House, 1 Alfred Rewane Road, Ikoyi, Lagos" },
  "MTN Nigeria": { email: "info@mtn.ng", phone: "0803-102-1700", extra: "letstalk.ng@mtn.com, investorrelations.ng@mtn.com" },
  "Moniepoint": { email: "support@moniepoint.com", phone: "0201 888 9990", extra: "hello@moniepoint.com" },
  "OPay": { email: "whistleblower01@opay-inc.com", phone: "0700 8888 328", phone2: "020 18888 328" },
  "SeamlessHR": { email: "hello@seamlesshr.com" },
  "Workforce Group": { email: "hello@workforcegroup.com", phone: "+234 903 194 6744" },
  "Phillips Consulting": { email: "enquiry@phillipsconsulting.net", phone: "+234 (0) 906 000 0804", phone2: "+234 (09) 290 4738", address: "9A Shafi Sule Street, Lekki Phase 1, Lagos" },
  "PwC Nigeria": { phone: "+234-201-2711700" },
  "Oando PLC": { email: "info@oandoplc.com", phone: "+234-02-014656000", address: "Lagos, Port Harcourt, Abuja offices" },
  "Dangote Cement": { email: "Customercare@dangote.com", phone: "+234-020-1460 6430", extra: "communications@dangote.com, I.R@dangote.com" },
  "BUA Cement": { email: "info@buacement.com", phone: "+234 (1) 461 0669-72" },
  "GIG Logistics (GIGL)": { email: "remmy@giglogistics.com", phone: "+234 708 096 0441", phone2: "+234 707 756 6565" },
  "MultiChoice Nigeria (DStv/GOtv)": { email: "info@multichoiceafrica.com" },
  "Leadway Assurance": { email: "insure@leadway.com", phone: "+234 020 12800 700", phone2: "+234 701 939 1747" },
  "Reddington Hospital": { email: "info@reddingtonhospital.com", phone: "09165359769", phone2: "012715340" },
  "Lagoon Hospitals (IHVN)": { email: "livemorelife@lagoonhospitals.com", phone: "+234 708 060 9000" },
  "Providus Bank": { email: "businessconcierge@providusbank.com", phone: "0700PROVIDUS (0700776348287)", phone2: "02012270200" },
  "Premium Trust Bank": { email: "contactpremium@premiumtrustbank.com", phone: "0700PREMIUM (07007736486)", phone2: "02013302777" },
  "Polaris Bank": { email: "yescenter@polarisbanklimited.com", phone: "0700-POLARIS (0700-7652747)", phone2: "0806 988 0000" },
  "NEM Insurance": { email: "nemsupport@nem-insurance.com", phone: "+234-02-014489560" },
  "Hygeia HMO": { email: "hycare@hygeiahmo.com", phone: "0700-HYGEIA-HMO (0700-494342-466)" },
  "UAC of Nigeria": { email: "info@uacnplc.com", phone: "+234 1 270 1879", phone2: "+234 808 878 7030" },
  "Wema Bank": { emailPattern: "firstname.lastname@wemabank.com", note: "HR Director confirmed: Ololade.Ogungbenro@wemabank.com" },
  "FCMB": { emailPattern: "firstname.lastname@fcmb.com" },
  "Stanbic IBTC": { phone: "+234 1 422 4000", address: "Walter Carrington Crescent, Victoria Island, Lagos" },
  "GTBank / GTCO": { phone: "0700 482 6328", address: "635 Akin Adesola Street, Victoria Island, Lagos" },
  "First Bank of Nigeria": { email: "firstcontact@firstbanknigeria.com", phone: "0700 FIRSTBANK", address: "Samuel Asabia House, 35 Marina, Lagos" },
  "Zenith Bank": { phone: "0700 ZENITH BANK", address: "Ajose Adeogun Street, Victoria Island, Lagos" },
  "UBA": { email: "cfc@ubagroup.com", phone: "+234 1 280 8822", address: "57 Marina, Lagos" },
  "Ecobank Nigeria": { email: "customercare@ecobank.com", phone: "+234 1 271 0391" },
  "Seplat Energy": { email: "info@seplatenergy.com", phone: "+234 1 277 0400" },
  "Shell Nigeria (SPDC)": { phone: "+234 1 277 0000", address: "Shell Industrial Area, Rumuobiakani, Port Harcourt" },
};

export default COMPANY_CONTACTS;
export function getCompanyContact(name) { return COMPANY_CONTACTS[name] || null; }
