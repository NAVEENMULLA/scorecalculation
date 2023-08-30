const metropolData = formatLogic.data.metropolData
console.log("Insert Metropol", formatLogic.data.outputQuery, formatLogic.data.scoreId.length)
const timeStamp = moment().utc().format("DD/MM/YYYY HH:mm:ss");
const {surname, first_name, last_name, gender, date_of_birth} = metropolData.identity_verification
const fullName = `${surname} ${first_name} ${last_name}`
const genderDetail = gender === "M" ? "MALE": "FEMALE"
const dobYear = moment(date_of_birth).format("YYYY")
const isMobileNumSame = metropolData.identity_scrub?.phone[0] === startTrigger.data.mobile ? "YES" : "NO MATCH"
const email = metropolData.identity_scrub?.email[0] || startTrigger.data?.email
const age = moment().diff(date_of_birth, 'years')
const findMetroScore = (x) => {
  let value = ""
  if (x >= 1 && x <= 200) value = "1-200"
  if (x >= 201 && x <= 300) value = "201-300"
  if (x >= 301 && x <= 400) value = "301-400"
  if (x >= 501 && x <= 600) value = "501-600"
  if (x >= 601 && x <= 700) value = "601-700"
  if (x >= 701 && x <= 800) value = "701-800"
  return value
}

const output = formatLogic.data.outputQuery


const metroScore = findMetroScore(metropolData.credit_score)
const requestPayload = {
  "Timestamp": timeStamp,
  "Customer ID": metropolData.identity_number,
  "CRB Report Reference": metropolData.trx_id,
  "Customer Name": fullName,
  "Gender": genderDetail,
  "Birth Year": dobYear,
  "Known Contact Numbers": 2,
  "Customer Age": age,
  "Score Matrix": [formatLogic.data.scoreId.id],
  "Email Address": email,
  "Metro Score": metroScore,
  // "PPI Score": "",
  "Is Phone No Matching": isMobileNumSame,
  "Raw Data": JSON.stringify(metropolData),
  "Open Default Loans": output.openDefaultLoans,
  "Total Default Loans Value": output.defaultLoansTotal,
  "Written OFF Loans": output.writtenOffLoans,
  "Settled After Default Loans": output.settledAfterDefaultLoans,
  "Is Known Bank Name": output.isKnownBank === "YES" ? true: false,
  "Open Loans Value": output.openLoansTotal,
  "Biggest Loan Paid OFF": output.highestLoanAmount,
  "Closed Default Loans": output.closedDefaultLoans,
  "Total Loans and Overdrafts": output.totalLoansAndOverDraftsPaidInTime,
  "Past 10 Loans Above 5000": output.paidOffLoans,
  
}

console.log(requestPayload)
return requestPayload
