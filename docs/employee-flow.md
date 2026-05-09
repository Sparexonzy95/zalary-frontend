# Employee Flow

## 1. Connect Wallet

The employee starts from the app entry flow and connects a wallet on Ethereum Sepolia. The connected wallet determines which claimable payroll runs are relevant.

## 2. Employee Claim Dashboard

The employee opens `/employee/claims` to see claimable payroll runs associated with the connected wallet.

## 3. Claimable Payroll

Claimable payroll entries show the employee which payroll runs are available, pending, or already moving through the claim lifecycle.

## 4. Claim Detail

Opening `/employee/claims/:claimId` shows the claim state, payroll metadata, and actions available to the employee.

## 5. Request Claim

The employee requests a claim. This demonstrates the first employee-side action in the confidential payroll claim path.

## 6. Finalize Claim

After the claim request is ready, the employee finalizes the claim. The UI is built to communicate progress and keep the employee in the correct flow.

## 7. Withdrawal Journey

After claim finalization, the employee can continue into the withdrawal flow. The frontend demonstrates how claim completion and withdrawal can be presented as a single coherent employee journey.

## What Judges Should Observe

- Employee-specific route protection and navigation.
- Wallet-linked claim discovery.
- Claim detail actions for request and finalization.
- Withdrawal actions after claim completion.
- The product UX assumption that claim-related values should remain confidential while the flow stays understandable.
