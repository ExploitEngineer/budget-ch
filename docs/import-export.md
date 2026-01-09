# Import / Export

The application supports importing and exporting data in CSV and JSON formats.

## Import Process

The import process follows a "Validation-First" approach to ensure data integrity.

### 1. Data Selection
Users can select the type of data to import:
- Transactions
- Budgets
- Saving Goals
- Accounts
- Transfers
- Full Export (JSON)

### 2. Modes
- **Append**: Adds new data without deleting existing records.
- **Replace**: Deletes EXISTING records of that type for the current Hub before importing new ones.
    > [!WARNING]
    > Using **Replace** mode on **Accounts** will delete all existing transactions in that Hub, as transactions are linked to accounts with a cascading delete constraint.

### 3. Validation
When a file is uploaded, a pre-flight validation report is generated:
- **Valid Rows**: Counts rows with valid dates and amounts.
- **Invalid Rows**: Rows that will be skipped.
- **Duplicates**: Detects potential duplicates already present in the database based on date, amount, and source.
    - Users can toggle **"Skip potential duplicates"** to ignore these during import.
- **New Categories**: Lists categories that will be created during import.
- **Missing Accounts**: Identifies accounts in the file that don't exist in the current Hub.

### 4. Account Mapping
If missing accounts are detected, the user MUST either:
- **Manual Mapping**: Select an existing account for each missing one.
- **Auto-create Accounts**: Use the "Create all missing accounts" shortcut to automatically create "Cash" type accounts for each missing name found in the file.

### 5. Accounts Support
Financial accounts can be imported with their starting balances.
- **Accepted Headers**:
    - **Account Name**: `Name`, `Konto`, `Conto`, `Compte`
    - **Type**: `Type`, `Typ`, `Tipo` (checking, savings, cash, credit-card)
    - **Starting Balance**: `Balance`, `InitialBalance`, `Kontostand`, `Starting Balance (CHF)`, `Saldo`
    - **IBAN**: `IBAN`
    - **Note**: `Note`, `Notiz`, `Nota`, `Remarque`
- **Upsert Behavior**: If an account with the same name exists, it will be updated with the new values instead of creating a duplicate.

### 6. Historical Data Support (Budgets)
The budget import now supports importing targets for specific months and years.
- **Accepted Headers**:
    - **Category**: `Category`, `Kategorie`, `Categoria`, `Catégorie`, `Group`, `Genre`
    - **Amount**: `Allocated`, `Budget`, `Importo`, `Montant`, `Budget (CHF)`
    - **Spent (IST)**: `Spent`, `IST`, `Actual`, `Effettivo`, `Réel`
    - **Month**: `Month`, `Monat`, `Mese`, `Mois` (1-12)
    - **Year**: `Year`, `Jahr`, `Anno`, `Année`
- **Behavior**: If month/year are missing, current month/year are used as default.

- **Behavior**: If month/year are missing, current month/year are used as default.

### 1. Transactions Support
Basic transaction import with automatic account and category creation.
- **Accepted Headers**:
    - **Date**: `Date`, `Datum`, `Data`
    - **Category**: `Category`, `Kategorie`, `Kategorien`, `Categoria`, `Catégorie`, `Catégories`, `Group`, `Genre`
    - **Account**: `Account`, `Konto`, `Conto`, `Compte`
    - **Amount**: `Amount`, `Amount (CHF)`, `Betrag`, `Betrag (CHF)`, `Importo`, `Importo (CHF)`, `Montant`, `Montant (CHF)`
    - **Type**: `Type`, `Typ`, `Tipo` (income, expense, transfer)
    - **Recipient**: `Recipient`, `Source`, `Quelle`, `Empfänger`, `Destinatario`, `Bénéficiaire`
    - **Note**: `Note`, `Notiz`, `Nota`, `Remarque`
- **Behavior**: If an account or category doesn't exist, it will be created automatically.

### 6. Saving Goals Support
Saving goals can be imported with automatic account association.
- **Accepted Headers**:
    - **Goal Name**: `Name`, `Goal`, `Ziel`, `Obiettivo`, `Nom`
    - **Target Amount**: `GoalAmount`, `Target Amount (CHF)`, `Target`, `Betrag`, `Montant`
    - **Account**: `Account`, `Konto`, `Conto`, `Compte`
    - **Target Date**: `Date`, `TargetDate`, `ZielDatum`, `Data`, `Échéance`
- **Behavior**: If an account is missing, it will be skipped unless "Auto-create accounts" is checked.

### 7. Transfers Support
Transfers between accounts can be imported.
- **Accepted Headers**:
    - **Date**: `Date`, `Datum`, `Data`
    - **From**: `From`, `Von`, `Da`, `De`
    - **To**: `To`, `An`, `A`, `À`
    - **Amount**: `Amount`, `Amount (CHF)`, `Betrag`, `Betrag (CHF)`, `Importo`, `Importo (CHF)`, `Montant`, `Montant (CHF)`
    - **Note**: `Note`, `Notiz`, `Nota`, `Remarque`
- **Behavior**: Source and destination accounts are required. If an account is missing, it will be created if "Auto-create accounts" is checked.

### 8. Standardized Hub Migration (JSON)
A complete export/import format for migrating entire Hub data. This format is standardized and ensures consistent field mapping regardless of language.

The JSON structure is:

```json
{
  "version": "1.2",
  "exportedAt": "2025-12-24T09:00:00.000Z",
  "hubId": "hub_id_here",
  "data": {
    "accounts": [{ "name": "...", "type": "...", "balance": 0, "iban": "...", "note": "..." }],
    "budgets": [{ "category": "...", "allocated": 0, "month": 12, "year": 2025, "warning": 80, "color": "standard" }],
    "transactions": [{ "date": "YYYY-MM-DD", "category": "...", "account": "...", "amount": 0, "type": "expense", "source": "...", "note": "..." }],
    "saving-goals": [{ "name": "...", "goal": 0, "saved": 0, "monthlyAllocation": 0, "account": "...", "dueDate": "YYYY-MM-DD" }],
    "transfers": [{ "date": "YYYY-MM-DD", "from": "...", "to": "...", "amount": 0, "note": "..." }]
  }
}
```

The importer is flexible and can handle both the `data` wrapper or flat structures for backwards compatibility.

**Import Order**: Accounts → Budgets → Transactions → Saving Goals → Transfers

### 9. Key Mapping and Robustness
The import service uses a `KEY_MAPPINGS` system to robustly handle different header names (e.g., `Category` vs `Kategorie`). This ensures that:
1.  **JSON Exports** using standardized keys are always prioritized.
2.  **CSV Exports** from different languages are correctly mapped to database fields.
3.  **Manual Edits** to files with variations in casing or spacing are normalized.

### 10. Implementation Details
- **Services**: 
    - `src/lib/services/import-service.ts`: Handles validation and database insertion.
    - `src/lib/services/export-service.ts`: Handles data extraction and formatting.
- **Actions**:
    - `validateTransactionsAction`: Generates the pre-flight report for individual files.
    - `validateFullJsonAction`: Validates full JSON export structure.
    - `importDataAction`: Performs the actual database mutation.
    - `exportHubDataAction`: Generates standardized Hub JSON.
- **Database**: Uses Drizzle ORM. Auto-creation of accounts and categories happens within a database transaction to ensure atomicity.

## Export Process
- **Quick Export (CSV)**: Available for all major data types individually. Uses current locale headers.
- **Hub Export (JSON)**: Exports the current Hub data into a standardized JSON file that can be re-imported seamlessly into any hub. (Recommended for backups/migration)
- **Full GDPR Export (JSON)**: Exports everything related to your user account, including profile, settings, subscriptions, and all hubs you belong to. Note: This format is primarily for data portability and is not directly importable as a single unit.
- **CSV Templates**: Blank templates with correct headers for manual data entry.

