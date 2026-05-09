# Employer Flow

## 1. Connect Wallet

The employer starts from the app entry flow and connects a wallet on Ethereum Sepolia. The wallet is used to identify the employer and sign/submit transaction-oriented actions.

## 2. Employer Onboarding / Demo Entry

The employer completes the role entry flow and lands in the employer workspace. This establishes the demo context for payroll creation and management.

## 3. Create Payroll

From `/employer/templates/new`, the employer creates a payroll template with a title, schedule, and payroll structure. This sets up the recurring or one-time payroll workflow shown in the UI.

## 4. Add Employees

The employer adds employee wallet addresses and employee payroll rows. These rows represent who can later discover and claim payroll.

## 5. Add Salary Allocations

The employer assigns salary allocations for each employee. The frontend demonstrates the confidential-payroll UX where sensitive allocation values are prepared for encrypted handling.

## 6. Create Payroll Run

From the payroll template detail page, the employer creates or opens a payroll run. The run detail page walks through the operational lifecycle for that payroll period.

## 7. Fund / Activate Payroll

The employer funds the payroll run and activates it once the required payroll state is ready. The UI separates creation, allocation handling, funding, and activation so judges can inspect each step.

## What Judges Should Observe

- Employer-specific route protection and navigation.
- A clear create-payroll interface.
- Employee allocation entry and payroll totals.
- Payroll template detail and run lifecycle screens.
- Funding and activation actions tied to Sepolia contract configuration.
- The product UX assumption that salary allocations should not be exposed as normal public values.
