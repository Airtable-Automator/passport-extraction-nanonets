import {
  Box,
  Heading,
  FormField,
  Input,
  TablePicker,
  FieldPicker,
  useViewport,
  Button
} from '@airtable/blocks/ui';
import { FieldType, Table, Field } from '@airtable/blocks/models';

import React, { useState } from 'react';
import { AppStates } from './settings';

export function ChooseSource({ appData, setAppData }) {
  const viewport = useViewport();
  const [table, setTable] = useState<Table>(null);
  const [imageField, setImageField] = useState<Field>(null);

  const isValid = table && imageField;

  const next = (e) => {
    // console.log(appState);
    e.preventDefault();
    const updatedAppData = { ...appData };
    // console.log(updatedAppState);
    updatedAppData.source = {
      table: table.name,
      passportField: imageField.name,
    };
    updatedAppData.appState = AppStates.PASSPORT_EXTRACTION;
    setAppData(updatedAppData);
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="center" border="default" flexDirection="column" width={viewport.size.width} height={viewport.size.height} padding='20px 0px'>
      <Box maxWidth='580px'>
        <Box paddingBottom='10px'>
          <Heading size="xlarge">Select Source for Passport Extraction</Heading>
        </Box>
        <form onSubmit={next}>
          <Box>
            <FormField label="Select Source Table">
              <TablePicker
                table={table}
                onChange={newTable => setTable(newTable)}
                width="320px"
              />
            </FormField>
          </Box>

          {table && <Box>
            <FormField label="Select Images Field (Only Attachments)">
              <FieldPicker
                table={table}
                field={imageField}
                onChange={newField => setImageField(newField)}
                allowedTypes={[FieldType.MULTIPLE_ATTACHMENTS]}
                width="320px"
              />
            </FormField>
          </Box>
          }

          {isValid &&
            <Box flexDirection='row-reverse'>
              <Button variant="primary" onClick={next}>Proceed to Extraction</Button>
            </Box>}
        </form>
      </Box>
    </Box>
  );
}