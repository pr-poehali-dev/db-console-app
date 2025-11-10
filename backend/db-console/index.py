'''
Business: CRUD API для управления записями в PostgreSQL базе данных
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with records data
'''

import json
import os
from typing import Dict, Any, Optional, List
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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('pathParams', {})
            record_id = params.get('id')
            
            if record_id:
                cursor.execute(
                    "SELECT * FROM records WHERE id = %s",
                    (record_id,)
                )
                record = cursor.fetchone()
                if not record:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Record not found'}),
                        'isBase64Encoded': False
                    }
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(record), default=str),
                    'isBase64Encoded': False
                }
            else:
                query_params = event.get('queryStringParameters', {})
                search = query_params.get('search', '')
                category = query_params.get('category', '')
                
                sql = "SELECT * FROM records WHERE 1=1"
                params_list = []
                
                if search:
                    sql += " AND (title ILIKE %s OR description ILIKE %s)"
                    search_pattern = f'%{search}%'
                    params_list.extend([search_pattern, search_pattern])
                
                if category:
                    sql += " AND category = %s"
                    params_list.append(category)
                
                sql += " ORDER BY created_at DESC"
                
                cursor.execute(sql, params_list)
                records = cursor.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(r) for r in records], default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            title = body_data.get('title', '').strip()
            description = body_data.get('description', '').strip()
            category = body_data.get('category', '').strip()
            status = body_data.get('status', 'active').strip()
            
            if not title:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Title is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                """INSERT INTO records (title, description, category, status) 
                   VALUES (%s, %s, %s, %s) RETURNING *""",
                (title, description, category, status)
            )
            new_record = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(new_record), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            params = event.get('pathParams', {})
            record_id = params.get('id')
            
            if not record_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Record ID is required'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            
            title = body_data.get('title', '').strip()
            description = body_data.get('description', '').strip()
            category = body_data.get('category', '').strip()
            status = body_data.get('status', '').strip()
            
            if not title:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Title is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                """UPDATE records 
                   SET title = %s, description = %s, category = %s, status = %s, 
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = %s RETURNING *""",
                (title, description, category, status, record_id)
            )
            updated_record = cursor.fetchone()
            
            if not updated_record:
                conn.rollback()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Record not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(updated_record), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('pathParams', {})
            record_id = params.get('id')
            
            if not record_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Record ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("DELETE FROM records WHERE id = %s RETURNING id", (record_id,))
            deleted = cursor.fetchone()
            
            if not deleted:
                conn.rollback()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Record not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'id': record_id}),
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
