const metropol = metropolResponse.data

const sortData = getScoreMatrix.data.records.map(i => {
    const items = i.fields
    items.id = i.id
    return items
});

const scorematrix = sortData.sort((a, b) => a.Serial - b.Serial);

const outputQuery = {}


if(metropolResponse.data.api_code_description === "No Account Information"){
let score = "No Record ID at CRB";
  return ({
    metropolData: metropol,
    score,
    scoreId: scorematrix.find(i => i["CRD Approval"] === score),
    outputQuery: null
})
}

else {


//********************Calculating Age (Parameter 1)

const birthDate = metropol.identity_verification.dob;
const ageInMillis = new Date() - new Date(birthDate);
const age = Math.floor(ageInMillis / (1000 * 60 * 60 * 24 * 365.25));
console.log("P 1 Age:", age);
outputQuery.age = age;

// // ********************The VALUE of BIGGEST LOAN PAID OFF IN TIME among most RECENT 10 LOANS (Parameter 2)
const lastTenRecentAccounts = metropol.account_info
    .sort((a, b) => new Date(b.date_opened) - new Date(a.date_opened))
    .slice(0, 10);
const lastTenAccountsLoans = lastTenRecentAccounts
    .filter(
        (account) =>
            account.account_status === "Closed" &&
            account.highest_days_in_arrears === 0
    )
    .map((account) => account.original_amount);

let highestLoanAmount;
if (lastTenAccountsLoans.length > 0) {
    highestLoanAmount = Math.max(...lastTenAccountsLoans);
} else {
    highestLoanAmount = 0;
}
console.log("P 2 highestLoanAmount:", highestLoanAmount);
outputQuery.highestLoanAmount = highestLoanAmount;


//********************Totals VALUE Open loans  (Parameter 3)
const openLoans = metropol.account_info.filter(
    (account) => !(account.account_status === "Closed")
);
const openLoansTotal = openLoans.reduce(
    (acc, account) => acc + parseFloat(account.original_amount),
    0
);
console.log("P 3", "openLoansTotal: ", openLoansTotal);
outputQuery.openLoansTotal = openLoansTotal

//********************Record of A known BANK name  (Parameter 4)
const knownBanks = ["KCB", "ABSA", "EQUITY", "COOP", "SCB", "BCBA"];
const accountNumbers = metropol.account_info.map(
    (account) => account.account_number
).join(" ");
const isKnownBank = knownBanks.some((bank) => accountNumbers.indexOf(bank) > -1)
// console.log('isKnownBank: ', isKnownBank? 'YES': 'NO');
outputQuery.isKnownBank = isKnownBank ? 'YES' : 'NO'

//********************Number of OPEN DEFAULT loans.  (Parameter 5)
const openDefaultLoans = metropol.account_info.filter((account) => (account.highest_days_in_arrears > 90 && account.account_status !== "Closed")).length
console.log("P 4", 'openDefaultLoans: ', openDefaultLoans);
outputQuery.openDefaultLoans = openDefaultLoans

//********************Number of CLOSED DEFAULT loans.  (Parameter 6)
const closedDefaultLoans = metropol.account_info.filter((account) => (account.highest_days_in_arrears > 90 && account.account_status === "Closed")).length
console.log("P 5", 'closedDefaultLoans: ', closedDefaultLoans);
outputQuery.closedDefaultLoans = closedDefaultLoans

//********************Number of WRITTEN OFF loans    (Parameter 10)
const writtenOffLoans = metropol.account_info.filter((account) => (account.account_status === "Write-Off")).length
console.log("P 6", 'writtenOffLoans: ', writtenOffLoans);
outputQuery.writtenOffLoans = writtenOffLoans

//********************Number of SETTLED AFTER DEFAULT loans    (Parameter 11)
const settledAfterDefaultLoans = metropol.account_info.filter((account) => (account.account_status === "Fully Settled" || account.account_status === "Settled")).length
console.log("P 7", 'settledAfterDefaultLoans: ', settledAfterDefaultLoans);
outputQuery.settledAfterDefaultLoans = settledAfterDefaultLoans

//********************PAST 10 LOANS ONLY - Number of Past loans paid off above 5,000 in time   (Parameter 8)
const paidOffLoans = lastTenRecentAccounts.filter((account) => (account.highest_days_in_arrears === 0 && parseFloat(account.original_amount) > 5000 && account.account_status === "Closed")).length
console.log("P 8", 'paidOffLoans: ', paidOffLoans);
outputQuery.paidOffLoans = paidOffLoans
// console.log(lastTenAccountss.filter((account) => (account.highest_days_in_arrears === 0 && parseFloat(account.original_amount) > 5000 && account.account_status === "Closed")))


//********************TOTAL VALUE of Default loans ( open and closed ) (Parameter 7)
const defaultLoansTotal = metropol.account_info.filter((account) => (account.highest_days_in_arrears > 90)).reduce((acc, account) => acc + parseFloat(account.original_amount), 0)
// console.log('defaultLoansTotal: ', defaultLoansTotal);
outputQuery.defaultLoansTotal = defaultLoansTotal

//********************Total loans plus OVERDRAFTS paid off in time   (Parameter 9)
const totalLoansAndOverDraftsPaidInTime = metropol.account_info.filter((account) => (account.highest_days_in_arrears === 0 && account.account_status === "Closed")).length
// console.log('totalLoansAndOverDraftsPaidInTime: ', totalLoansAndOverDraftsPaidInTime);
outputQuery.totalLoansAndOverDraftsPaidInTime = totalLoansAndOverDraftsPaidInTime

// // //********************Testing
// const age = 29 // parameter 1
// const highestLoanAmount = 3948.12 // parameter 2
// const openLoansTotal = 19150 // parameter 3
// const openDefaultLoans = 1 // parameter 5
// const closedDefaultLoans = 0 // parameter 6
// const writtenOffLoans = 1 // parameter 10
// const settledAfterDefaultLoans = 0 // parameter 11
// const paidOffLoans = 0 // parameter 8

const defaultCRDApproval = scorematrix[9]["CRD Approval"];
const conditions = [
    [8, () => writtenOffLoans >= scorematrix[8]["Written OFF Loans"]],
    [7, () => (
        (openDefaultLoans >= scorematrix[7]["Open Default Loans"] || closedDefaultLoans >= scorematrix[7]["Closed Default Loans"] || writtenOffLoans === scorematrix[7]["Written OFF Loans"] || settledAfterDefaultLoans >= scorematrix[7]["Settled After Default Loans"]) ||
        (highestLoanAmount < scorematrix[7]["Biggest Loan Paid OFF"] && openLoansTotal < scorematrix[7]["Open Loans"] && (openDefaultLoans >= scorematrix[7]["Open Default Loans"] || closedDefaultLoans >= 1 || writtenOffLoans === scorematrix[7]["Written OFF Loans"] || settledAfterDefaultLoans >= scorematrix[7]["Settled After Default Loans"]))
    )],
    [6, metropol.account_info?.length === 0 ? () => age > scorematrix[6]["Customer Age"] : () => age > scorematrix[6]["Customer Age"] && highestLoanAmount < scorematrix[6]["Biggest Loan Paid OFF"] && openLoansTotal < scorematrix[6]["Open Loans"] && closedDefaultLoans === scorematrix[6]["Closed Default Loans"] && openDefaultLoans === scorematrix[6]["Open Default Loans"] && writtenOffLoans === scorematrix[6]["Written OFF Loans"] && settledAfterDefaultLoans === scorematrix[6]["Settled After Default Loans"]],
    [5, metropol.account_info?.length === 0 ? () => age <= scorematrix[6]["Customer Age"] : () => age <= scorematrix[5]["Customer Age"] && highestLoanAmount < scorematrix[5]["Biggest Loan Paid OFF"] && openLoansTotal < scorematrix[5]["Open Loans"] && closedDefaultLoans === scorematrix[5]["Closed Default Loans"] && openDefaultLoans === scorematrix[5]["Open Default Loans"] && writtenOffLoans === scorematrix[5]["Written OFF Loans"] && settledAfterDefaultLoans === scorematrix[5]["Settled After Default Loans"]],
    [4, () => (highestLoanAmount >= scorematrix[4]["Biggest Loan Paid OFF"] || openLoansTotal >= scorematrix[4]["Open Loans"]) && (closedDefaultLoans === scorematrix[4]["Closed Default Loans"] || closedDefaultLoans === 1) && openDefaultLoans === scorematrix[4]["Open Default Loans"] && writtenOffLoans === scorematrix[4]["Written OFF Loans"] && settledAfterDefaultLoans === scorematrix[4]["Settled After Default Loans"]],
    [3, () => (highestLoanAmount >= scorematrix[3]["Biggest Loan Paid OFF"] || openLoansTotal >= scorematrix[3]["Open Loans"]) && closedDefaultLoans <= scorematrix[3]["Closed Default Loans"] && openDefaultLoans === scorematrix[3]["Open Default Loans"] && writtenOffLoans === scorematrix[3]["Written OFF Loans"] && settledAfterDefaultLoans === scorematrix[3]["Settled After Default Loans"] && paidOffLoans <= scorematrix[3]["Past 10 Loans Above 5000"]],
    [2, () => (highestLoanAmount >= scorematrix[2]["Biggest Loan Paid OFF"] || openLoansTotal >= scorematrix[2]["Open Loans"]) && closedDefaultLoans === scorematrix[2]["Closed Default Loans"] && openDefaultLoans === scorematrix[2]["Open Default Loans"] && writtenOffLoans === scorematrix[2]["Written OFF Loans"] && settledAfterDefaultLoans === scorematrix[2]["Settled After Default Loans"] && paidOffLoans === scorematrix[2]["Past 10 Loans Above 5000"]],
    [1, () => (highestLoanAmount >= scorematrix[1]["Biggest Loan Paid OFF"] || openLoansTotal >= scorematrix[1]["Open Loans"]) && closedDefaultLoans === scorematrix[1]["Closed Default Loans"] && openDefaultLoans === scorematrix[1]["Open Default Loans"] && writtenOffLoans === scorematrix[1]["Written OFF Loans"] && settledAfterDefaultLoans === scorematrix[1]["Settled After Default Loans"] && paidOffLoans === scorematrix[1]["Past 10 Loans Above 5000"]],
    [0, () => (highestLoanAmount >= scorematrix[0]["Biggest Loan Paid OFF"] || openLoansTotal >= scorematrix[0]["Open Loans"]) && closedDefaultLoans === scorematrix[0]["Closed Default Loans"] && openDefaultLoans === scorematrix[0]["Open Default Loans"] && writtenOffLoans === scorematrix[0]["Written OFF Loans"] && settledAfterDefaultLoans === scorematrix[0]["Settled After Default Loans"] && paidOffLoans >= scorematrix[0]["Past 10 Loans Above 5000"]]
];

let score = defaultCRDApproval;

for (const [index, condition] of conditions) {
    if (condition()) {
        score = scorematrix[index]["CRD Approval"];
        console.log("Automated Credit Score", score)
        break;
    }
}
outputQuery.score = score
console.log("score", score)
return ({
    metropolData: metropol,
    score,
    scoreId: scorematrix.find(i => i["CRD Approval"] === score),
    outputQuery
})
}
