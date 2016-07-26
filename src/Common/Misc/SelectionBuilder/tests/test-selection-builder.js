/* global it describe ParaViewWeb expect */
describe('Selection builder', function() {
  it('test all data format', function(done) {
    expect(ParaViewWeb.Common.Misc.SelectionBuilder).toBeDefined();
    const selectionBuilder = ParaViewWeb.Common.Misc.SelectionBuilder;

    const emptySelection = selectionBuilder.empty();
    const rangeSelection = selectionBuilder.range({
      pressure: [
        { interval: [0, 101.3], endpoints: 'oo', uncertainty: 15 },
        { interval: [200, 400], endpoints: '*o', uncertainty: 30 },
      ],
      temperature: [
        { interval: [233, Number.MAX_VALUE], endpoints: 'oo', uncertainty: 15 },
      ],
    });
    const partitionSelection = selectionBuilder.partition('pressure', [
      { value: 101.3, uncertainty: 20 },
      { value: 200, uncertainty: 40, closeToLeft: true },
    ]);

    console.log('emptySelection', JSON.stringify(emptySelection, 2));
    console.log('rangeSelection', JSON.stringify(rangeSelection, 2));
    console.log('partitionSelection', JSON.stringify(partitionSelection, 2));


    console.log('to rule: emptySelection', JSON.stringify(selectionBuilder.convertToRuleSelection(emptySelection), 2));
    console.log('to rule: rangeSelection', JSON.stringify(selectionBuilder.convertToRuleSelection(rangeSelection), 2));
    console.log('to rule: partitionSelection', JSON.stringify(selectionBuilder.convertToRuleSelection(partitionSelection), 2));
    done();
  });
});
