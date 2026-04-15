# Data Persistence

Your e-commerce application now has **persistent data storage** using JSON files. This means all your data will be saved and restored even after restarting the server.

## What Gets Saved

All data is automatically saved to the `data/` folder:

- **users.json** - All registered customers
- **orders.json** - All placed orders with full details
- **products.json** - All products in your store
- **counter.json** - Order ID counter

## How It Works

### Automatic Saving
Data is automatically saved whenever:
- A new user registers
- An order is placed
- Order status is updated
- A product is added, edited, or deleted

### Automatic Loading
When the server starts, it automatically loads all data from the JSON files.

## Server Startup Messages

When you start the server, you'll see:
```
📊 Data loaded:
  - Users: X
  - Orders: Y
  - Products: Z
✅ Test server running on http://localhost:3000
```

This confirms your data has been loaded successfully.

## Testing Persistence

1. **Add some data:**
   - Register a user
   - Place an order
   - Edit a product in admin panel

2. **Stop the server** (Ctrl+C)

3. **Restart the server:**
   ```bash
   node test-server.js
   ```

4. **Check your data** - Everything should still be there!

## Data Location

All data files are in: `project node/data/`

You can:
- View the JSON files to see your data
- Backup these files to save your data
- Delete them to reset everything

## Important Notes

- Data is stored in plain JSON format (easy to read and backup)
- In production, you should use a proper database (MySQL, MongoDB, etc.)
- The admin password is still hardcoded (username: admin, password: admin123)
- For better security, consider encrypting passwords

## Backup Your Data

To backup your data, simply copy the entire `data/` folder:
```bash
cp -r data/ data-backup/
```

## Reset Everything

To start fresh, delete all JSON files:
```bash
rm data/*.json
```

The server will recreate them with default products on next start.
