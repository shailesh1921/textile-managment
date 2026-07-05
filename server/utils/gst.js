function calculateGstTax(partyStateCode, millStateCode, lines) {
  const isInterstate = partyStateCode !== millStateCode;
  let taxableTotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  const computedLines = lines.map((line) => {
    const taxable = parseFloat(line.taxable_value) || 0;
    const rate = parseFloat(line.gst_rate) || 18;
    const tax = (taxable * rate) / 100;
    taxableTotal += taxable;
    let lineCgst = 0;
    let lineSgst = 0;
    let lineIgst = 0;
    if (isInterstate) {
      lineIgst = tax;
      igst += tax;
    } else {
      lineCgst = tax / 2;
      lineSgst = tax / 2;
      cgst += lineCgst;
      sgst += lineSgst;
    }
    return {
      ...line,
      taxable_value: taxable,
      cgst: lineCgst,
      sgst: lineSgst,
      igst: lineIgst,
    };
  });
  return {
    is_interstate: isInterstate,
    place_of_supply: partyStateCode,
    taxable_value: taxableTotal,
    cgst_amount: cgst,
    sgst_amount: sgst,
    igst_amount: igst,
    total_amount: taxableTotal + cgst + sgst + igst,
    lines: computedLines,
  };
}

module.exports = { calculateGstTax };
