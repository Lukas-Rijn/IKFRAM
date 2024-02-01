import argparse
import sqlite3
import elasticsearch 
from elasticsearch.helpers import bulk

import json
import tarfile
import logging
import sys
import time

LOG_LEVEL   = logging.INFO
log         = logging.getLogger("index-Log")

def setLogger():
    '''
    Logger boilerplate
    '''
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    log.addHandler(handler)
    log.setLevel(LOG_LEVEL)

def createIndex(ES_CLIENT: elasticsearch.Elasticsearch, INDEX_NAME: str, mappings: dict):
    '''
    Create the index with specified name and mapping
    :param client: ElasticSearch client
    :param INDEX_NAME: Name of the index that the documents will be retrieved from
    :param mappings: Specified mapping that the data in the index will be mapped on
    '''
    log.info("Creating new index "+ INDEX_NAME)
    response = ES_CLIENT.options(ignore_status=400).indices.create(
        index   = INDEX_NAME,
        body    = mappings
        )
    log.info(f"Result: {response}")

def addMultipleDocs(ES_CLIENT: elasticsearch.Elasticsearch, INDEX_NAME: str, docList:list):
    '''
    Indexes the documents into the ElasticSearch index
    :param client: ElasticSearch client
    :param INDEX_NAME: Name of the index that the documents will be indexed in
    :param docList: list of documents that will be added
    '''

    actions = [
        {
            "_index": INDEX_NAME,
            "_source": doc
        } for doc in docList
    ] 
    bulk(ES_CLIENT ,actions)

def addSingleDoc(ES_CLIENT: elasticsearch.Elasticsearch, INDEX_NAME: str, doc: dict):
    '''
    Adds single document to index. For debug purposes
    :param client: ElasticSearch client
    :param INDEX_NAME: Name of the index that the document will be indexed in
    :param doc: Document that will be added to the index
    '''
    ES_CLIENT.index(index=INDEX_NAME, document=doc)

def extractDBfromTar(imageName: str, dbPath: str):
    '''
    Extracts database from image, places it in this folder. (update to be able to set to target dest)
    :param imageName: image that the database will be extracted from, must be TAR file.
    :param dbPath: relative path of the database within the image
    '''
    try:
        tar = tarfile.open(imageName)
        log.info("Extracting database")
        tar.extract(dbPath)
        log.info("Finished!")
    except tarfile.ReadError:
        log.error("Image is not a TAR file")
        print("Specify correct image or q to exit:")
        imageName = input()
        if imageName == "q":
            log.info("Script terminated")
            sys.exit()
        extractDBfromTar(imageName, dbPath)
    

def getRowsFromTable(dbFile: str, table:str) -> list:
    '''
    Retrieves all rows from given database and table
    :param dbFile: Path to database file
    :param table: Name of the table the rows will be retrieved from
    '''
    conn = sqlite3.connect(dbFile)
    conn.row_factory = sqlite3.Row # This enables column access by name: row['column_name']
    db = conn.cursor()

    rows = db.execute('''
    SELECT * FROM 
    '''+ table).fetchall()

    conn.commit()
    conn.close()
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--input', help="Input image file")
    parser.add_argument('-o', '--output', help="Database dump location") 
    args = parser.parse_args()

    print(args.input)
    DATABASE_PATH = "Dump/data/data/com.android.providers.telephony/databases/mmssms.db"
    INDEX_NAME = "ikfram-1"
    TAR_PATH = "C:\\Users\\luuk9\\DevelopStuff\\IKFRAM\\resources\\Dump.tar"

    setLogger()
    startTime = time.time()

    connectionConfigurationFile = open("connection-config.json")
    connectionConfiguration = json.load(connectionConfigurationFile)
    connectionConfiguration["ELASTIC_HOST"]

    mappingFile             = open("mappings")
    mappings                = json.load(mappingFile)
    
    ES_CLIENT               = elasticsearch.Elasticsearch(
        hosts               = connectionConfiguration["ELASTIC_HOST"],
        basic_auth          = (connectionConfiguration["ELASTIC_USERNAME"], connectionConfiguration["ELASTIC_PASSWORD"])
        )
    createIndex(ES_CLIENT, INDEX_NAME, mappings)
    
    #extractDBfromTar(TAR_PATH, DATABASE_PATH)
    textRows = getRowsFromTable(DATABASE_PATH, "messages")

    docList = []
    for text in textRows:
        doc = {
            "id"        : text["_id"],
            "sender"    : text["address"],
            "content"   : text["content"],
            "date"      : text["date"]
        }
        docList.append(doc)

    addMultipleDocs(ES_CLIENT, INDEX_NAME, docList)

    log.info(f"Processing database took {time.time() - startTime} seconds")

if __name__ == "__main__":
   main()
    



