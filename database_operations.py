from datetime import datetime

import gridfs


class DatabaseOperations:
    def __init__(self, db):
        self.db = db
        self.fs = gridfs.GridFS(db)
        self.petitions = db['petitions']
        self.audit = db['audit_trail']

    async def store_petition_data(self, user_id, image_data, extracted_data, verification_status=False):
        try:
            # Store image in GridFS
            image_id = self.fs.put(image_data, filename=f'petition_{datetime.now().timestamp()}.png')

            # Create petition document
            petition_doc = {
                'user_id': user_id,
                'image_id': image_id,
                'first_name': extracted_data['first_name'],
                'last_name': extracted_data['last_name'],
                'address': extracted_data['address'],
                'street_number': extracted_data['street_number'],
                'street_name': extracted_data['street_name'],
                'zip_code': extracted_data['zip_code'],
                'verified': verification_status,
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'verified_by': user_id if verification_status else None,
                'verification_date': datetime.now() if verification_status else None
            }

            result = self.petitions.insert_one(petition_doc)
            petition_id = result.inserted_id

            # Create audit trail entry
            self.create_audit_log(
                user_id=user_id,
                action_type='CREATE',
                petition_id=petition_id,
                description=f'Petition created with verification status: {verification_status}'
            )

            return petition_id

        except Exception as e:
            print(f"Database Error: {str(e)}")
            return None

    async def search_petitions(self, query):
        try:
            results = list(self.petitions.find(query))
            petition_results = []

            for result in results:
                try:
                    # Get image from GridFS
                    image_data = self.fs.get(result['image_id']).read()

                    petition_data = {
                        'id': str(result['_id']),
                        'first_name': result['first_name'],
                        'last_name': result['last_name'],
                        'address': result['address'],
                        'street_number': result['street_number'],
                        'street_name': result['street_name'],
                        'zip_code': result['zip_code'],
                        'verified': result['verified'],
                        'verification_date': result.get('verification_date'),
                        'verified_by': result.get('verified_by'),
                        'created_at': result['created_at'],
                        'image_data': image_data
                    }
                    petition_results.append(petition_data)
                except Exception as e:
                    print(f"Error processing result {result['_id']}: {str(e)}")
                    continue

            return petition_results
        except Exception as e:
            print(f"Search Error: {str(e)}")
            return []

    def create_audit_log(self, user_id, action_type, petition_id, description):
        try:
            audit_doc = {
                'user_id': user_id,
                'action_type': action_type,
                'petition_id': petition_id,
                'description': description,
                'timestamp': datetime.now()
            }
            self.audit.insert_one(audit_doc)
        except Exception as e:
            print(f"Audit Log Error: {str(e)}")