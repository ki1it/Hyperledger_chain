/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry getFactory emit */

/**
 * Sample transaction processor function.
 * @param {org.example.basic.SampleTransaction} tx The sample transaction instance.
 * @transaction
 */
/*async function sampleTransaction(tx) {  // eslint-disable-line no-unused-vars

    // Save the old value of the asset.
    const oldValue = tx.asset.value;

    // Update the asset with the new value.
    tx.asset.value = tx.newValue;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('org.example.basic.Document');
    // Update the asset in the asset registry.
    await assetRegistry.update(tx.asset);

    // Emit an event for the modified asset.
    let event = getFactory().newEvent('org.example.doc', 'SampleEvent');
    event.asset = tx.asset;
    event.oldValue = oldValue;
    event.newValue = tx.newValue;
    emit(event);
}*/

/**
 * Create the DOC asset
 * @param {org.example.doc.InitialApplication} initalAppliation - the InitialApplication transaction
 * @transaction
 */
async function initialApplication(application) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.loc';
  
    const document = factory.newResource(namespace, 'Document', application.documentId);
    document.applicant = factory.newRelationship(namespace, 'UniversityEmployee', application.applicant.getIdentifier());
    document.University = factory.newRelationship(namespace, 'University', application.applicant.university.getIdentifier());
    document.rules = application.rules;
    document.documentDetails = application.documentDetails;
    document.evidence = [];
    document.approval = [factory.newRelationship(namespace, 'UniversityEmployee', application.applicant.getIdentifier())];
    document.status = 'AWAITING_APPROVAL';
  	document.type = 'ORDER';

    //save the application
    const assetRegistry = await getAssetRegistry(document.getFullyQualifiedType());
    await assetRegistry.add(document);

    // emit event
    const applicationEvent = factory.newEvent(namespace, 'InitialApplicationEvent');
    applicationEvent.doc = document;
    emit(applicationEvent);
}
/**
 * Create the DOC asset
 * @param {org.example.doc.InitialApplicationDocument} initalAppliationDocument - the InitialApplication transaction
 * @transaction
 */
async function initialApplicationDocument(application) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.doc';

    const doc = factory.newResource(namespace, 'Document', application.documentId);
    doc.applicant = factory.newRelationship(namespace, 'Person', application.applicant.getIdentifier());
    doc.university = factory.newRelationship(namespace, 'University', application.university.getIdentifier());
    doc.changes = application.changes;
	doc.date = application.date;
 	doc.text = application.text;
  	doc.date = application.date;
    doc.evidence = [];
    doc.approval = [factory.newRelationship(namespace, 'Person', application.applicant.getIdentifier())];
    doc.status = 'AWAITING_APPROVAL';
  	doc.type = application.type;

    //save the application
    const assetRegistry = await getAssetRegistry(doc.getFullyQualifiedType());
    await assetRegistry.add(doc);

    // emit event
    const applicationEvent = factory.newEvent(namespace, 'InitialApplicationDocumentEvent');
    applicationEvent.doc = doc;
    emit(applicationEvent);
}
