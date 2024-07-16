from pymongo import MongoClient

def create_database_and_collection():
    # URI do MongoDB local
    uri = "mongodb+srv://renatoggonalves9:6B6jy8Fb1oNSZlGa@cluster0.msivyf9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    
    # Conectar ao MongoDB
    client = MongoClient(uri)
    
    # Criar banco de dados 'botDatabase'
    db = client.botDatabase
    
    # Criar coleção 'contacts'
    collection = db.contacts
    
    # Verificar se a coleção já contém documentos
    if collection.count_documents({}) == 0:
        # Estrutura do documento a ser inserido
        document = {
            "contactId": "",
            "state": "initial",
            "planDescription": "",
            "transactionId": "",
            "transactionAmount": 0
        }
        
        # Inserir o documento na coleção
        result = collection.insert_one(document)
        
        # Exibir ID do documento inserido
        print(f"Documento de estrutura inserido com o ID: {result.inserted_id}")
    else:
        print("A coleção já contém documentos. Nenhum documento foi inserido.")

if __name__ == "__main__":
    create_database_and_collection()
