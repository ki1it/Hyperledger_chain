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
    doc.assignedDocs = [];
    doc.approval = [factory.newRelationship(namespace, application.applicant.getType(), application.applicant.getIdentifier())];
    doc.status = 'AWAITING_APPROVAL';
    doc.type = application.type;
  	if (application.type === 'ORDER_TO_PRACTICE'){
      doc.countSigners = 3;
      doc.signers = [factory.newRelationship(namespace, 'Dean', 1),
                     factory.newRelationship(namespace, 'Teacher', 1),
                     factory.newRelationship(namespace, 'Head_of_department', 1)]
                   
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
 * @param {org.example.doc.CreateDemoParticipants} createDemoParticipants - the CreateDemoParticipants transaction
 * @transaction
 */

async function createDemoParticipants() { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.doc';

    // create the University
    const univerRegistry = await getParticipantRegistry(namespace + '.University');
    const univer1 = factory.newResource(namespace, 'University', '1');
    univer1.name = 'AltSTU';
    await univerRegistry.add(univer1);
    const univer2 = factory.newResource(namespace, 'University', '2');
    univer2.name = 'ASU';
    await univerRegistry.add(univer2);

    // create teachers
    const teacherRegistry = await getParticipantRegistry(namespace + '.Teacher');
    const teacher1 = factory.newResource(namespace, 'Teacher', '1');
    teacher1.name = 'Staroletov';
    teacher1.faculty = 'FIT';
    teacher1.level = 10;
    teacher1.university = factory.newRelationship(namespace, 'University', '1');
    await teacherRegistry.add(teacher1);
    const teacher2 = factory.newResource(namespace, 'Teacher', '2');
    teacher2.name = 'Ella';
    teacher2.faculty = 'FIT';
    teacher2.level = 10;
    teacher2.university = factory.newRelationship(namespace, 'University', '1');
    await teacherRegistry.add(teacher2);

      // create HoD
    const hodRegistry = await getParticipantRegistry(namespace + '.Head_of_department');
    const hod1 = factory.newResource(namespace, 'Head_of_department', '1');
    hod1.name = 'Kantor';
    hod1.department = 'FIT';
    hod1.level = 17;
    hod1.university = factory.newRelationship(namespace, 'University', '1');
    await hodRegistry.add(hod1);
  
    // create Dean
    const deanRegistry = await getParticipantRegistry(namespace + '.Dean');
    const dean1 = factory.newResource(namespace, 'Dean', '1');
    dean1.name = 'Avdeev';
    dean1.faculty = 'FIT';
    dean1.level = 15;
    dean1.university = factory.newRelationship(namespace, 'University', '1');
    await deanRegistry.add(dean1);
  
  // create HR
    const hrRegistry = await getParticipantRegistry(namespace + '.HR');
    const hr1 = factory.newResource(namespace, 'HR', '1');
    hr1.name = 'Dinner';
    hr1.level = 21;
    hr1.university = factory.newRelationship(namespace, 'University', '1');
    await hrRegistry.add(hr1);
  
  
   // create PracticeDep
    const practiceDepRegistry = await getParticipantRegistry(namespace + '.PracticeDep');
    const practiceDep1 = factory.newResource(namespace, 'PracticeDep', '1');
    practiceDep1.name = 'Taran';
    practiceDep1.level = 21;
    practiceDep1.university = factory.newRelationship(namespace, 'University', '1');
    await practiceDepRegistry.add(practiceDep1);
  
  
    // create ViceRector
    const viceRectorRegistry = await getParticipantRegistry(namespace + '.ViceRector');
    const viceRector1 = factory.newResource(namespace, 'ViceRector', '1');
    viceRector1.name = 'Svistula';
    viceRector1.level = 30;
    viceRector1.university = factory.newRelationship(namespace, 'University', '1');
    await viceRectorRegistry.add(viceRector1);
  
  
	 // create CommonDep
    const commonDepRegistry = await getParticipantRegistry(namespace + '.CommonDep');
    const commonDep1 = factory.newResource(namespace, 'CommonDep', '1');
    commonDep1.name = 'Svistula';
    commonDep1.level = 50;
    commonDep1.university = factory.newRelationship(namespace, 'University', '1');
    await commonDepRegistry.add(commonDep1);
}
