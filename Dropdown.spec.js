import ConnectedDropdown, {Dropdown} from './Dropdown';

function setup() {
  const props = {
    toggleItem: jest.fn(),
    errorClass: true,
    list: [],
    flag: '',
    title: ''
  }

  const state = {
    listOpen: false,
    headerTitle: '',
  }

  const initialStore = {
    ui: {
      countryDropdown: ''
    }
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
    const enzymeWrapper = shallow(<Dropdown {...props}/>)
    expect(enzymeWrapper.length).toEqual(1)
  });

  it('--- Connected component renders without crashing', () => {
    const enzymeWrapper = shallow(<ConnectedDropdown {...props} store={store}/>)
    expect(enzymeWrapper.length).toEqual(1)
  })

  it('--- Connected component contains props', () => {
    props.errorClass = false
    const enzymeWrapper = shallow(<ConnectedDropdown {...props} store={store}/>)
    expect(enzymeWrapper.prop('errorClass')).toEqual(props.errorClass)
  })
})