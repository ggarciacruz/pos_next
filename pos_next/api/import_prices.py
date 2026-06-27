import os
import openpyxl
import frappe

def import_prices():
    # Since CWD is sites/
    path = "dev.nueva-era.mandox.com.bo/public/files/inventario Nueva Era Mayo 2026.xlsx"
    print(f"CWD: {os.getcwd()}")
    print(f"Reading file from: {path}")
    print(f"File exists: {os.path.exists(path)}")
    
    try:
        wb = openpyxl.load_workbook(path, data_only=True)
        sheet = wb.active
        print(f"Loaded sheet: {sheet.title}, row count: {sheet.max_row}")
    except Exception as e:
        print(f"Failed to load workbook: {e}")
        return

    # Print first 5 rows to inspect
    rows = list(sheet.iter_rows(min_row=2, max_row=7, values_only=True))
    print(f"Sample rows: {rows}")

    created_count = 0
    updated_count = 0
    missing_items = []
    
    try:
        print("Starting row iteration...")
        for r_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), 2):
            if not row:
                continue
            if len(row) < 5:
                if r_idx < 10:
                    print(f"Row {r_idx} skipped due to length: {len(row)}")
                continue
                
            group, code, medida, nombre, precio, *rest = row
            
            if not code:
                if r_idx < 10:
                    print(f"Row {r_idx} skipped due to empty code")
                continue
                
            item_code = str(code).strip()
            
            # Check if item exists in DB
            if not frappe.db.exists("Item", item_code):
                missing_items.append(item_code)
                if r_idx < 10:
                    print(f"Row {r_idx} skipped: Item {item_code} does not exist in DB")
                continue
                
            try:
                price_val = float(precio) if precio is not None else 0.0
            except ValueError:
                price_val = 0.0
                
            if r_idx < 10:
                print(f"Row {r_idx} ({item_code}) price: {price_val}")
                
            for price_list in ["Standard Selling", "Venta estándar"]:
                try:
                    existing_price = frappe.db.get_value("Item Price", {"item_code": item_code, "price_list": price_list})
                    if existing_price:
                        frappe.db.set_value("Item Price", existing_price, "price_list_rate", price_val)
                        updated_count += 1
                    else:
                        doc = frappe.new_doc("Item Price")
                        doc.item_code = item_code
                        doc.price_list = price_list
                        doc.price_list_rate = price_val
                        doc.currency = "BOB"
                        doc.insert(ignore_permissions=True)
                        created_count += 1
                except Exception as ex:
                    print(f"Error on row {r_idx} ({item_code}) for price list {price_list}: {ex}")
                    
        frappe.db.commit()
        print(f"Import Summary:")
        print(f"  Created {created_count} Item Price records.")
        print(f"  Updated {updated_count} Item Price records.")
        print(f"  Missing items in DB: {len(missing_items)}")
        if missing_items:
            print(f"  Sample missing items: {missing_items[:10]}")
    except Exception as e:
        print(f"Error during iteration: {e}")
