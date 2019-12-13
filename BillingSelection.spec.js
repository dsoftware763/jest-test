import BillingSelection from './BillingSelection'

describe("$$$ BillingSelection Component Test", () => {
  
    it('--- Component renders without crashing', () => {
      const enzymeWrapper = shallow(<BillingSelection/>)
      expect(enzymeWrapper.length).toEqual(1)
      expect(enzymeWrapper.find('RadioButton').length).toEqual(2)
    });
  })