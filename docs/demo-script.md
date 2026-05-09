# 3-Minute Demo Script

## 0:00-0:25 - Problem

"Payroll is one of the most sensitive financial workflows a company runs. On public blockchains, normal token transfers can expose salary amounts, claim values, and operational payroll timing. Zalary asks a simple question: can payroll be wallet-native and auditable without forcing private compensation data into public view?"

## 0:25-0:50 - Zalary Solution

"Zalary is a confidential payroll dApp powered by Zama FHEVM. The goal is to let employers create and manage payroll flows while employees claim and withdraw payroll through a clean wallet-based experience. The frontend focuses on showing the real employer and employee journeys."

## 0:50-1:40 - Employer Walkthrough

"I start as an employer, connect my wallet on Ethereum Sepolia, and enter the employer workspace. From here I can create a payroll, add employee wallet addresses, and enter salary allocations. The payroll detail pages then guide me through creating a payroll run, preparing allocations, funding the run, and activating payroll."

"The important thing to observe is that the UI treats salary allocations as sensitive workflow values. The employer still gets a usable payroll operations interface, but the design is built around confidential contract flows."

## 1:40-2:25 - Employee Walkthrough

"Now I switch to the employee journey. The employee connects a wallet and opens the claims dashboard. Claimable payroll runs appear for that wallet. From the claim detail page, the employee can request a claim, finalize the claim when ready, and continue into the withdrawal flow."

"The employee does not need to understand every contract primitive. The frontend keeps the path clear: find claimable payroll, request, finalize, and withdraw."

## 2:25-2:50 - Zama / FHE Explanation

"Zama FHEVM is the privacy layer that makes this payroll idea possible. Instead of publishing sensitive payroll values as normal public blockchain data, the system can be designed around encrypted values and proof-backed actions. That is especially important for salary allocation and claim-related data."

## 2:50-3:00 - Closing

"For the Builder Track submission, judges should review this frontend alongside the separate smart contract repository. Together they demonstrate how confidential payroll can be made practical for employers and understandable for employees."
