import ConnectedPaymentSelection, {PaymentSelection} from './PaymentSelection';

function setup() {
  const props = {
    setSelectedStripeMethod: jest.fn(),
    setSelectedPaymentMethod: jest.fn(),
    setFinished: jest.fn(),
    setLoading: jest.fn(),
    setLoadingPayStatus: jest.fn(),
    setPaymentAuthCallError: jest.fn(),
    setStripeCompleted:  jest.fn(),
    updateCustomerParaspar: jest.fn(),
    setStepFinished: jest.fn(),
    setSubscribeMethod: jest.fn(),
    setDeliveryAddressEdit: jest.fn(),
    setManualAddress: jest.fn(),
    setEmailError: jest.fn(),
    setFirstNameError: jest.fn(),
    setPhoneError: jest.fn(),
    setTitleError: jest.fn(),
    setBillingAddressError: jest.fn(),
    setBillingCityError: jest.fn(),
    restrictedProduct: '',
    addressRestricted: '',
    quantityRestricted: '',
    cart: '',
    customer: '',
    address: '',
    users: '',
    addressBilling: '',
    ui: '',

  }

  const state = {
    listOpen: false,
    headerTitle: '',
  }

  const initialStore = {
    ui: {
      countryDropdown: ''
    },
    data: '',
    users: '',
    form: {
        address: '',
        addressBilling: '',
        customer: ''
    },
    errors: {
        customerErrors: '',
        addressErrors: '',
        usersErrors: ''
    },
    ui: '',
    cart: '',
    payments: ''
  }

  const handleClickOutside = jest.fn()
  const toggleList = jest.fn(()=>{state.listOpen = true})
  const handleClick = jest.fn()

  return {
    initialStore,
    state,
    props
  }
}

describe("$$$ Dropdown Component Test", () => {
  let store
  const { initialStore, props } = setup()
  let mockStore = configureStore()
  beforeEach(()=>{
    store = mockStore(initialStore)
  })

  it('--- Component renders without crashing', () => {
    const enzymeWrapper = shallow(<PaymentSelection {...props}/>)
    expect(enzymeWrapper.length).toEqual(1)
  });

  it('--- Connected component renders without crashing', () => {
    const enzymeWrapper = shallow(<ConnectedPaymentSelection {...props} store={store}/>)
    expect(enzymeWrapper.length).toEqual(1)
  })

  it('--- Connected component contains props', () => {
    props.errorClass = false
    const enzymeWrapper = shallow(<ConnectedPaymentSelection {...props} store={store}/>)
    expect(enzymeWrapper.prop('errorClass')).toEqual(props.errorClass)
  })
})