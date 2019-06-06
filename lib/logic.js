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

'use strict';

/* global getFactory getAssetRegistry getParticipantRegistry emit */

/**
 * Create the DOC asset
 * @param {org.example.doc.InitialApplicationDocument} initalAppliationDocument - the InitialApplication transaction
 * @transaction
 */
async function initialApplicationDocument(application) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.doc';

    const doc = factory.newResource(namespace, 'Document', application.documentId);
    doc.applicant = factory.newRelationship(namespace, application.applicant.getType(), application.applicant.getIdentifier());
    doc.university = factory.newRelationship(namespace, 'University', application.university.getIdentifier());
    doc.changes = application.changes;
	doc.date = application.date;
 	doc.text = application.text;
  	doc.date = application.date;
    doc.evidence = [];
    doc.approval = [factory.newRelationship(namespace, 'Person', application.applicant.getIdentifier())];
    doc.status = 'AWAITING_APPROVAL';
    doc.type = application.type;
  	if (application.type === 'ORDER_TO_PRACTICE'){
      doc.countSigners = 3;
      doc.signersOrder = '10 15 20'
    }
  	
  	

    //save the application
    const assetRegistry = await getAssetRegistry(doc.getFullyQualifiedType());
    await assetRegistry.add(doc);

    // emit event
    const applicationEvent = factory.newEvent(namespace, 'InitialApplicationDocumentEvent');
    applicationEvent.doc = doc;
    emit(applicationEvent);
}

/**
 * Update the LOC to show that it has been approved by a given person
 * @param {org.example.doc.Approve} approve - the Approve transaction
 * @transaction
 */
async function approve(approveRequest) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.doc';

    let doc = approveRequest.doc;

    if (doc.status === 'CLOSED' || doc.status === 'REJECTED') {
        throw new Error ('This doc has already been closed');
    } else if (doc.approval.includes(approveRequest.approvingParty)) {
        throw new Error ('This person has already approved this doc');
    }
  /*else if (doc.type === 'ORDER_TO_PRACTICE') {
    
    } 
  else if (approveRequest.approvingParty.getType() === 'BankEmployee') {
        letter.approval.forEach((approvingParty) => {
            let bankApproved = false;
            try {
                bankApproved = approvingParty.getType() === 'BankEmployee' && approvingParty.bank.getIdentifier() === approveRequest.approvingParty.bank.getIdentifier();
            } catch (err) {
                // ignore error as they don't have rights to access that participant
            }
            if (bankApproved) {
                throw new Error('Your bank has already approved of this request');
            }
        });
    }*/

    doc.approval.push(factory.newRelationship(namespace, approveRequest.approvingParty.getType(), approveRequest.approvingParty.getIdentifier()));
    // update the status of the letter if everyone has approved
    if (doc.approval.length === doc.countSigners) {
        doc.status = 'APPROVED';
    }

    // update approval[]
    const assetRegistry = await getAssetRegistry(approveRequest.doc.getFullyQualifiedType());
    await assetRegistry.update(doc);

    // emit event
    const approveEvent = factory.newEvent(namespace, 'ApproveEvent');
    approveEvent.doc = approveRequest.doc;
    approveEvent.changes = approveRequest.changes;
    approveEvent.approvingParty = approveRequest.approvingParty;
    emit(approveEvent);
}

/**
 * Reject the DOC
 * @param {org.example.doc.Reject} reject - the Reject transaction
 * @transaction
 */
async function reject(rejectRequest) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.doc';

    let doc = rejectRequest.doc;

    if (doc.status === 'CLOSED' || doc.status === 'REJECTED') {
        throw new Error('This letter of credit has already been closed');
    } else if (doc.status === 'APPROVED') {
        throw new Error('This letter of credit has already been approved');
    } else {
        doc.status = 'REJECTED';
        doc.closeReason = rejectRequest.closeReason;

        // update the status of the LOC
        const assetRegistry = await getAssetRegistry(rejectRequest.doc.getFullyQualifiedType());
        await assetRegistry.update(doc);

        // emit event
        const rejectEvent = factory.newEvent(namespace, 'RejectEvent');
        rejectEvent.doc = rejectRequest.doc;
        rejectEvent.closeReason = rejectRequest.closeReason;
        emit(rejectEvent);
    }
}

/**
 * Suggest changes to the current rules in the LOC
 * @param {org.example.doc.SuggestChanges} suggestChanges - the SuggestChanges transaction
 * @transaction
 */
async function suggestChanges(changeRequest) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.doc';

    let doc = changeRequest.doc;

    if (doc.status === 'CLOSED' || doc.status === 'REJECTED') {
        throw new Error ('This document has already been closed');
    } else if (doc.status === 'APPROVED') {
        throw new Error('This document has already been approved');
    } else {
        doc.changes = changeRequest.changes;
        // the rules have been changed - clear the approval array and update status
        doc.approval = [changeRequest.suggestingParty];
        doc.status = 'AWAITING_APPROVAL';

        // update the loc with the new rules
        const assetRegistry = await getAssetRegistry(changeRequest.doc.getFullyQualifiedType());
        await assetRegistry.update(doc);

        // emit event
        const changeEvent = factory.newEvent(namespace, 'SuggestChangesEvent');
        changeEvent.doc = changeRequest.doc;
        changeEvent.changes = changeRequest.changes;
        changeEvent.suggestingParty = changeRequest.suggestingParty;
        emit(changeEvent);
    }
}
/**
 * Assign number to the current document
 * @param {org.example.doc.AssignNumber} assignNumber - the AssignNumber transaction
 * @transaction
 */
async function assignNumber(assignNumberRequest) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.doc';

    let doc = assignNumberRequest.doc;

    if (doc.status === 'CLOSED' || doc.status === 'REJECTED') {
        throw new Error ('This document has already been closed');
    } else if (doc.status === 'APPROVED') {
        throw new Error('This document has already been approved');
    } else {
        doc.innerNumber = assignNumberRequest.innerNumber;

        // update the loc with the new rules
        const assetRegistry = await getAssetRegistry(assignNumberRequest.doc.getFullyQualifiedType());
        await assetRegistry.update(doc);

        // emit event
        const assignNumberEvent = factory.newEvent(namespace, 'AssignNumberEvent');
        assignNumberEvent.doc = assignNumberRequest.doc;
        assignNumberEvent.innerNumber = assignNumberRequest.innerNumber;
        emit(assignNumberEvent);
    }
}


/**
 * "Ship" the product
 * @param {org.example.loc.ShipProduct} shipProduct - the ShipProduct transaction
 * @transaction
 */
/*
async function shipProduct(shipRequest) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.loc';

    let letter = shipRequest.loc;

    if (letter.status === 'APPROVED') {
        letter.status = 'SHIPPED';
        letter.evidence.push(shipRequest.evidence);

        //update the status of the loc
        const assetRegistry = await getAssetRegistry(shipRequest.loc.getFullyQualifiedType());
        await assetRegistry.update(letter);

        // emit event
        const shipEvent = factory.newEvent(namespace, 'ShipProductEvent');
        shipEvent.loc = shipRequest.loc;
        emit(shipEvent);
    } else if (letter.status === 'AWAITING_APPROVAL') {
        throw new Error ('This letter needs to be fully approved before the product can be shipped');
    } else if (letter.status === 'CLOSED' || letter.status === 'REJECTED') {
        throw new Error ('This letter of credit has already been closed');
    } else {
        throw new Error ('The product has already been shipped');
    }
}

/**
 * "Recieve" the product that has been "shipped"
 * @param {org.example.loc.ReceiveProduct} receiveProduct - the ReceiveProduct transaction
 * @transaction
 */
/*
async function receiveProduct(receiveRequest) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.loc';

    let letter = receiveRequest.loc;

    if (letter.status === 'SHIPPED') {
        letter.status = 'RECEIVED';

        // update the status of the loc
        const assetRegistry = await getAssetRegistry(receiveRequest.loc.getFullyQualifiedType());
        await assetRegistry.update(letter);

        // emit event
        const receiveEvent = factory.newEvent(namespace, 'ReceiveProductEvent');
        receiveEvent.loc = receiveRequest.loc;
        emit(receiveEvent);
    } else if (letter.status === 'AWAITING_APPROVAL' || letter.status === 'APPROVED'){
        throw new Error('The product needs to be shipped before it can be received');
    } else if (letter.status === 'CLOSED' || letter.status === 'REJECTED') {
        throw new Error ('This letter of credit has already been closed');
    } else {
        throw new Error('The product has already been received');
    }
}


/**
 * Mark a given letter as "ready for payment"
 * @param {org.example.loc.ReadyForPayment} readyForPayment - the ReadyForPayment transaction
 * @transaction
 */
/*
async function readyForPayment(paymentRequest) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.loc';

    let letter = paymentRequest.loc;

    if (letter.status === 'RECEIVED') {
        letter.status = 'READY_FOR_PAYMENT';

        // update the status of the loc
        const assetRegistry = await getAssetRegistry(paymentRequest.loc.getFullyQualifiedType());
        await assetRegistry.update(letter);

        // emit event
        const paymentEvent = factory.newEvent(namespace, 'ReadyForPaymentEvent');
        paymentEvent.loc = paymentRequest.loc;
        emit(paymentEvent);
    } else if (letter.status === 'CLOSED' || letter.status === 'REJECTED') {
        throw new Error('This letter of credit has already been closed');
    } else if (letter.status === 'READY_FOR_PAYMENT') {
        throw new Error('The payment has already been made');
    } else {
        throw new Error('The payment cannot be made until the product has been received by the applicant');
    }
}


/**
 * Close the DOC
 * @param {org.example.doc.Close} close - the Close transaction
 * @transaction
 */
/*
async function close(closeRequest) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.doc';

    let letter = closeRequest.loc;

    if (letter.status === 'READY_FOR_PAYMENT') {
        letter.status = 'CLOSED';
        letter.closeReason = closeRequest.closeReason;

        // update the status of the loc
        const assetRegistry = await getAssetRegistry(closeRequest.loc.getFullyQualifiedType());
        await assetRegistry.update(letter);

        // emit event
        const closeEvent = factory.newEvent(namespace, 'CloseEvent');
        closeEvent.loc = closeRequest.loc;
        closeEvent.closeReason = closeRequest.closeReason;
        emit(closeEvent);
    } else if (letter.status === 'CLOSED' || letter.status === 'REJECTED') {
        throw new Error('This letter of credit has already been closed');
    } else {
        throw new Error('Cannot close this letter of credit until it is fully approved and the product has been received by the applicant');
    }
}

/**
 * Create the participants needed for the demo
 * @param {org.example.loc.CreateDemoParticipants} createDemoParticipants - the CreateDemoParticipants transaction
 * @transaction
 */
/*
async function createDemoParticipants() { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.doc';

    // create the banks
    const bankRegistry = await getParticipantRegistry(namespace + '.Bank');
    const bank1 = factory.newResource(namespace, 'Bank', 'BoD');
    bank1.name = 'Bank of Dinero';
    await bankRegistry.add(bank1);
    const bank2 = factory.newResource(namespace, 'Bank', 'EB');
    bank2.name = 'Eastwood Banking';
    await bankRegistry.add(bank2);

    // create bank employees
    const employeeRegistry = await getParticipantRegistry(namespace + '.BankEmployee');
    const employee1 = factory.newResource(namespace, 'BankEmployee', 'matias');
    employee1.name = 'Matías';
    employee1.bank = factory.newRelationship(namespace, 'Bank', 'BoD');
    await employeeRegistry.add(employee1);
    const employee2 = factory.newResource(namespace, 'BankEmployee', 'ella');
    employee2.name = 'Ella';
    employee2.bank = factory.newRelationship(namespace, 'Bank', 'EB');
    await employeeRegistry.add(employee2);

    // create customers
    const customerRegistry = await getParticipantRegistry(namespace + '.Customer');
    const customer1 = factory.newResource(namespace, 'Customer', 'alice');
    customer1.name = 'Alice';
    customer1.lastName= 'Hamilton';
    customer1.bank = factory.newRelationship(namespace, 'Bank', 'BoD');
    customer1.companyName = 'QuickFix IT';
    await customerRegistry.add(customer1);
    const customer2 = factory.newResource(namespace, 'Customer', 'bob');
    customer2.name = 'Bob';
    customer2.lastName= 'Appleton';
    customer2.bank = factory.newRelationship(namespace, 'Bank', 'EB');
    customer2.companyName = 'Conga Computers';
    await customerRegistry.add(customer2);
}
*/
