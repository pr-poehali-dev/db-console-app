'''
Business: CRUD API для управления таблицами materials, operations, orders в PostgreSQL
Args: event - dict with httpMethod, body, queryStringParameters, pathParams
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with table data
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL environment variable not set')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Table-Name',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    table_name = headers.get('X-Table-Name', headers.get('x-table-name', 'materials'))
    
    if table_name not in ['materials', 'operations', 'orders']:
        table_name = 'materials'
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('pathParams', {})
            item_id = params.get('id')
            
            if item_id:
                cursor.execute(f"SELECT * FROM {table_name} WHERE id = %s", (item_id,))
                item = cursor.fetchone()
                if not item:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Item not found'}),
                        'isBase64Encoded': False
                    }
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(item), default=str),
                    'isBase64Encoded': False
                }
            else:
                query_params = event.get('queryStringParameters', {})
                search = query_params.get('search', '')
                
                if search:
                    if table_name == 'materials':
                        sql = f"SELECT * FROM {table_name} WHERE name ILIKE %s ORDER BY created_at DESC"
                        cursor.execute(sql, (f'%{search}%',))
                    elif table_name == 'operations':
                        sql = f"SELECT * FROM {table_name} WHERE name ILIKE %s OR description ILIKE %s ORDER BY created_at DESC"
                        cursor.execute(sql, (f'%{search}%', f'%{search}%'))
                    else:
                        sql = f"SELECT * FROM {table_name} WHERE customer_name ILIKE %s OR description ILIKE %s ORDER BY created_at DESC"
                        cursor.execute(sql, (f'%{search}%', f'%{search}%'))
                else:
                    cursor.execute(f"SELECT * FROM {table_name} ORDER BY created_at DESC")
                
                items = cursor.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(r) for r in items], default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            if table_name == 'materials':
                name = body_data.get('name', '').strip()
                unit = body_data.get('unit', '').strip()
                price = body_data.get('price_per_unit', 0)
                stock = body_data.get('stock_quantity', 0)
                
                if not name or not unit:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Name and unit are required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    """INSERT INTO materials (name, unit, price_per_unit, stock_quantity) 
                       VALUES (%s, %s, %s, %s) RETURNING *""",
                    (name, unit, price, stock)
                )
            
            elif table_name == 'operations':
                name = body_data.get('name', '').strip()
                description = body_data.get('description', '').strip()
                cost = body_data.get('cost', 0)
                duration = body_data.get('duration_minutes', 0)
                
                if not name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Name is required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    """INSERT INTO operations (name, description, cost, duration_minutes) 
                       VALUES (%s, %s, %s, %s) RETURNING *""",
                    (name, description, cost, duration)
                )
            
            else:
                customer = body_data.get('customer_name', '').strip()
                description = body_data.get('description', '').strip()
                status = body_data.get('status', 'pending').strip()
                total_cost = body_data.get('total_cost', 0)
                deadline = body_data.get('deadline', None)
                
                if not customer:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Customer name is required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    """INSERT INTO orders (customer_name, description, status, total_cost, deadline) 
                       VALUES (%s, %s, %s, %s, %s) RETURNING *""",
                    (customer, description, status, total_cost, deadline)
                )
            
            new_item = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(new_item), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            params = event.get('pathParams', {})
            item_id = params.get('id')
            
            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID is required'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            
            if table_name == 'materials':
                name = body_data.get('name', '').strip()
                unit = body_data.get('unit', '').strip()
                price = body_data.get('price_per_unit', 0)
                stock = body_data.get('stock_quantity', 0)
                
                cursor.execute(
                    """UPDATE materials SET name = %s, unit = %s, price_per_unit = %s, 
                       stock_quantity = %s, updated_at = CURRENT_TIMESTAMP
                       WHERE id = %s RETURNING *""",
                    (name, unit, price, stock, item_id)
                )
            
            elif table_name == 'operations':
                name = body_data.get('name', '').strip()
                description = body_data.get('description', '').strip()
                cost = body_data.get('cost', 0)
                duration = body_data.get('duration_minutes', 0)
                
                cursor.execute(
                    """UPDATE operations SET name = %s, description = %s, cost = %s, 
                       duration_minutes = %s, updated_at = CURRENT_TIMESTAMP
                       WHERE id = %s RETURNING *""",
                    (name, description, cost, duration, item_id)
                )
            
            else:
                customer = body_data.get('customer_name', '').strip()
                description = body_data.get('description', '').strip()
                status = body_data.get('status', 'pending').strip()
                total_cost = body_data.get('total_cost', 0)
                deadline = body_data.get('deadline', None)
                
                cursor.execute(
                    """UPDATE orders SET customer_name = %s, description = %s, status = %s, 
                       total_cost = %s, deadline = %s, updated_at = CURRENT_TIMESTAMP
                       WHERE id = %s RETURNING *""",
                    (customer, description, status, total_cost, deadline, item_id)
                )
            
            updated_item = cursor.fetchone()
            
            if not updated_item:
                conn.rollback()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Item not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(updated_item), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('pathParams', {})
            item_id = params.get('id')
            
            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(f"DELETE FROM {table_name} WHERE id = %s RETURNING id", (item_id,))
            deleted = cursor.fetchone()
            
            if not deleted:
                conn.rollback()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Item not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'id': item_id}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cursor.close()
        conn.close()