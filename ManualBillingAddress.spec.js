import ConnectedManualBillingAddress, {ManualBillingAddress} from './ManualBillingAddress';

function setup() {
  const props = {
    setManualAddress: jest.fn(),
    fetchPostCodeAddress: jest.fn(),
    setBillingAddressError: jest.fn(),
    retrievePostCodeAddress: jest.fn(),
    setBillingAddressAutocompleteOpen: jest.fn(),
    setCity: jest.fn(),
    setCityError: jest.fn(),
    setCountry: jest.fn(),
    setCountryError: jest.fn(),
    setPostCodeBilling: jest.fn(),
    setPostCodeBillingError: jest.fn(),
    setAddress: jest.fn(),
    setFlag: jest.fn(),
    setShortCountry: jest.fn(),
    setAddressRestricted: jest.fn(),
    postCode: '',
    address: '',
    city: '',
    country: '',
    countries: '',
    restrictedProduct: '',
    shippingAddress: '',
    data: '',
    billingAddress: {},
    addressBillingError: '',
    addressBilling: '',
    cityBillingError: '',
    cityBilling: '',
    postCodeBillingError: '',
    postCodeBilling: '',
    errors: '',
    customer: ''
  }

  const state = {
    country: "United Kingdom",
    countryIndex:"GB",
    region: '',
    discountTabStatus:false
  }

  const initialStore = {
    form: {
      addressBilling: '',
      address: '',
      customer: ''
    },
    errors: {
      addressBillingErrors: '',
      customerErrors: '',
      cartErrors: ''
    },
    cart: '',
    collect: ''
  }

  return {
    initialStore,
    state,
    props
  }
}

describe("$$$ ManualBillingAddress Component Test", () => {
  let store
  const { initialStore, props } = setup()
  let mockStore = configureStore()
  beforeEach(()=>{
    store = mockStore(initialStore)
  })

  it('--- Component renders without crashing', () => {
    const enzymeWrapper = shallow(<ManualBillingAddress {...props}/>)
    expect(enzymeWrapper.length).toEqual(1)
  });

  it('--- Connected component renders without crashing', () => {
    const enzymeWrapper = shallow(<ConnectedManualBillingAddress {...props} store={store}/>)
    expect(enzymeWrapper.length).toEqual(1)
  })

  it('--- Connected component contains props', () => {
    props.country = ''
    const enzymeWrapper = shallow(<ConnectedManualBillingAddress {...props} store={store}/>)
    expect(enzymeWrapper.prop('country')).toEqual(props.country)
  })
})