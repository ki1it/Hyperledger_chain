# Basic Sample Business Network

> My diploma project on Hyperledger Fabric

This business network defines:

**Participant**
`Person`
`UniversityEmployee`

**Asset**
`Document`

**Transaction**
`SampleTransaction`

**Event**
`SampleEvent`

SampleAssets are owned by a SampleParticipant, and the value property on a SampleAsset can be modified by submitting a SampleTransaction. The SampleTransaction emits a SampleEvent that notifies applications of the old and new values for each modified SampleAsset.

To test this Business Network Definition in the **Test** tab:

Create a `University` participant:

```
{
  "$class": "org.example.basic.SampleTransaction",
  "asset": "resource:org.example.basic.Document#2626",
  "newValue": "AltSTU"
}
```

Create a `UniversityEmployee` participant:

```
{
  "$class": "org.example.basic.UniversityEmployee",
  "university": "resource:org.example.basic.University#8476",
  "position": "TEACHER",
  "personId": "6117",
  "name": "Ivan",
  "lastName": "Ivanov"
}
```

Create a `Document` asset:

```
{
  "$class": "org.example.basic.Document",
  "documentId": "8485",
  "applicant": "resource:org.example.basic.UniversityEmployee#0260",
  "exportingBank": "resource:org.example.basic.University#5494",
  "rules": [
    {
      "$class": "org.example.basic.Rule",
      "ruleId": "Aliqua duis.",
      "ruleText": "Esse exercitation in."
    }
  ],
  "documentDetails": {
    "$class": "org.example.basic.DocumentDetails",
    "date": "11.05.2019",
    "number": 43770,
    "name": "Veniam."
  },
  "evidence": [
    "Nostrud do tempor."
  ],
  "approval": [
    "resource:org.example.basic.UniversityEmployee#1384"
  ],
  "status": "AWAITING_APPROVAL",
  "type": "ORDER"
}
```

Submit a `SampleTransaction` transaction:

```
{
  "$class": "org.example.basic.SampleTransaction",
  "asset": "resource:org.example.basic.SampleAsset#assetId:1",
  "newValue": "new value"
}
```

After submitting this transaction, you should now see the transaction in the Transaction Registry and that a `SampleEvent` has been emitted. As a result, the value of the `assetId:1` should now be `new value` in the Asset Registry.

Congratulations!

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
