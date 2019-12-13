import React from "react";
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import {setShipment, setTotal} from "../actions/cartActions";
import {setManual, setShowPayment} from "../actions/collectActions";
import {requestCheckoutData} from "../actions/userActions";
import * as customerActions from "../actions/customerActions";
import {setStepFinished, setStepperIndex} from "../actions/stepperActions";
import * as billingActions from "../actions/billingAddressActions";
import {Icon} from 'react-fa'
import {setManualAddress} from "../actions/collectActions";
import TextField from 'material-ui/TextField';
import * as billingErrorsActions from "../actions/billingAddressErrorsActions";
import Dropdown from "./Dropdown";
import { setAddressRestricted } from "../actions/cartErrorsActions";

export class ManualBillingAddress extends React.Component{

    constructor (props) {
        super(props);

        this.state = { country: "United Kingdom", countryIndex:"GB", region: '',discountTabStatus:false };
    }

    fetchAddressSuggestions = (address) =>{
        this.props.setManualAddress(address);
        this.props.fetchPostCodeAddress(address,'');
        this.props.setBillingAddressError(null);
    }

    retrieveAddressSuggestion = (address) =>{

        if(address.Type == "Address") {
            this.props.retrievePostCodeAddress(address.Id, "collect-manual");
        }
        else {
            this.props.fetchPostCodeAddress(this.props.collect.manualAddress, address.Id);
            this.props.setBillingAddressAutocompleteOpen(true);
        }

    }

    handleFieldValidation = (name, value) => {
        if (name == 'city') {
            this.props.setCity(value);
            this.props.setCityError(null);
        }
        else if (name == 'country') {
            this.props.setCountry(value);
            this.props.setCountryError(null);
        }
        else if (name == 'postCode') {
            this.props.setPostCodeBilling(value);
            this.props.setPostCodeBillingError(null);
        }
        else if (name == 'addressBilling') {
            this.props.setAddress(value);
            this.props.setBillingAddressError(null);
        }
    }

    handleAddressChange = () => {
        let short_country = null;
        let address = '';
        if(this.props.postCode) {
            address = this.props.postCode+" ";
        }
        if(this.props.address) {
            address += this.props.address+" ";
        }
        if(this.props.city) {
            address +=this.props.city+ " ";
        }
        if(this.props.country) {
            address += this.props.country+ " ";
        }

        address = address.replace(/\s+/g, '+');
        let url = "https://maps.google.com/maps/api/geocode/json?key=AIzaSyBtpsssdIm0a5m-Cmdvv_7m82gEAc5EEQw&address=" + address;
        fetch(url).then((response) => response.json())
            .then((responseJson) => {
                responseJson.results && responseJson.results.forEach((item) => {
                    let address =  item.address_components;
                    address.forEach((addr) => {
                        if(addr.types.includes('country')) {
                            short_country = addr.short_name;
                        }
                    });
                });

                if(short_country) {
                    this.props.setShortCountry(short_country);
                }
            }).catch((error) => {
            console.error(error);
        });
    }

    selectCountry (val,e) {
        var index = e.target.selectedIndex;
        var optionElement = e.target.childNodes[index]
        var option =  optionElement.text;
        let flag;
        let countries = this.props.countries;
        if (countries)
            for (let country in countries){
                if (countries[country].iso2 === val){
                    flag = countries[country].img_svg;
                    this.props.setFlag(flag)
                    break;
                }
                this.props.setFlag(null);
            }
        this.props.setShortCountry(val);
        this.props.setCountry(option);

        this.setState({ countryIndex: val,country:option });

    }

    changeCountry = (key) => {
        let temp = this.props.countries[key];
        temp.selected = !temp.selected;
        this.props.setFlag(temp.img_svg);
        this.props.setShortCountry(temp.iso2);
        this.props.setCountry(temp.country);
        this.props.setCountryError(null);
        this.setState({ countryIndex: temp.iso2,country:temp.country});

        if (this.props.restrictedProduct && temp.iso2 !== "GB"){
            this.props.setAddressRestricted(true);
        } else if (this.props.restrictedProduct && temp.iso2 === "GB" && this.props.shippingAddress.shortCountry === "GB") {
            this.props.setAddressRestricted(false);
        }
    };

    render(){
        const themeConf = this.props.data ? this.props.data.themeConfiguration : null;
        const inputsPropsText = this.props.data ? themeConf.shippingAddress.inputs.text : null;
        const inputsPropsTextOk = this.props.data ? themeConf.shippingAddress.inputs.textOk : null;
        const inputsPropsLabel = this.props.data ? themeConf.shippingAddress.inputs.label : null;
        const placeholderStyle = this.props.data ? themeConf.shippingAddress.inputs.placeholder : null;
        const inputRootStyle = {height:"40px",marginTop:"40px"};
        const errorStyle = {top:"5px"};
        let addressDataSource = [];

        if(this.props.customer.addressSuggestions)
        {

            addressDataSource = this.props.customer.addressSuggestions.map((suggestion)=>{

                return Object.assign({fullAddress:suggestion.Text+ " " +suggestion.Description},suggestion);

            });
        }

        //country select value
        let shortCountry = "";

        if (this.props.billingAddress.shortCountry) {
            shortCountry = this.props.billingAddress.shortCountry;
        }
        else if (this.state.countryIndex) {
            shortCountry = this.state.countryIndex;
        }

        return (
           <div>
               <div className="row">
                   <div className="col-md-12">
                       <TextField
                           name="addressBilling"
                           placeholder="Enter Location"
                           floatingLabelFixed={true}
                           hintStyle={{...placeholderStyle}}
                           errorStyle={{...errorStyle}}
                           style={{...inputRootStyle}}
                           inputStyle={(this.props.addressBillingError == null && this.props.addressBilling) ? {...inputsPropsTextOk} : {...inputsPropsText}}
                           floatingLabelStyle={{...inputsPropsLabel}}
                           floatingLabelText="Location"
                           underlineShow={false}
                           fullWidth={true}
                           value={this.props.addressBilling || ''}
                           onChange={(e, value) => {this.handleFieldValidation('addressBilling', value)}}
                           errorText={ this.props.addressBillingError == null ? "" : this.props.addressBillingError }
                           className={this.props.addressBillingError == null ? "input-gray" : "inputStyleError"}
                       />

                       {
                           (this.props.addressBillingError == null && this.props.addressBilling)
                               ?
                               <Icon
                                   className={"inputIconShippingOk"}
                                   name="check"/>
                               :
                               <Icon
                                   className={this.props.addressBillingError == null ? "inputIconHidden" : "inputIconError"}
                                   name="times-circle-o"/>
                       }

                   </div>
               </div>
               <div className="row">
                   <div className="col-md-12">
                       <TextField
                           name="city"
                           placeholder="Enter City"
                           floatingLabelFixed={true}
                           hintStyle={{...placeholderStyle}}
                           errorStyle={{...errorStyle}}
                           style={{...inputRootStyle}}
                           inputStyle={(this.props.cityBillingError == null && this.props.cityBilling) ? {...inputsPropsTextOk} : {...inputsPropsText}}
                           floatingLabelStyle={{...inputsPropsLabel}}
                           floatingLabelText="City"
                           underlineShow={false}
                           fullWidth={true}
                           value={this.props.cityBilling || ''}
                           onChange={(e, value) => {this.handleFieldValidation('city', value)}}
                           errorText={ this.props.cityBillingError == null ? "" : this.props.cityBillingError }
                           className={this.props.cityBillingError == null ? "input-gray" : "inputStyleError"}
                           onBlur={(e, value) => {this.handleAddressChange()}}
                       />

                       {
                           (this.props.cityBillingError == null && this.props.cityBilling)
                               ?
                               <Icon
                                   className={"inputIconShippingOk"}
                                   name="check"/>
                               :
                               <Icon
                                   className={this.props.cityBillingError == null ? "inputIconHidden" : "inputIconError"}
                                   name="times-circle-o"/>
                       }
                   </div>
               </div>

               <div className="row">

                   <div className="col-md-12" style={{paddingTop:"40px",position:"relative"}}>

                       <div className="countryDropDownLabel">Billing Country</div>

                       <Dropdown
                           title={this.props.billingAddress.countryBilling}
                           list={this.props.countries}
                           toggleItem={this.changeCountry}
                           flag={this.props.billingAddress.flag}
                           errorClass={this.props.countryBillingError ? "select-country-error" : ""}
                       />
                        {this.props.countryBillingError  && 
                            <span className="country-error">{this.props.countryBillingError}</span>
                        }
                   </div>

               </div>

               <div className="row">
                 
                   <div className="col-md-12">
                       <TextField
                           name="postCode"
                           placeholder="Enter PostCode"
                           floatingLabelFixed={true}
                           hintStyle={{...placeholderStyle}}
                           errorStyle={{...errorStyle}}
                           style={{...inputRootStyle}}
                           inputStyle={(this.props.postCodeBillingError == null && this.props.postCodeBilling) ? {...inputsPropsTextOk} : {...inputsPropsText}}
                           floatingLabelStyle={{...inputsPropsLabel}}
                           floatingLabelText="Postcode"
                           underlineShow={false}
                           fullWidth={true}
                           onChange={(e, value) => {this.handleFieldValidation('postCode', value);} }
                           value={this.props.postCodeBilling ? this.props.postCodeBilling : "" }
                           errorText={ this.props.postCodeBillingError == null ? "" : this.props.postCodeBillingError }
                           className={this.props.postCodeBillingError == null ? "input-gray" : "inputStyleError"}
                           onBlur={(e, value) => {this.handleAddressChange()}}
                       />

                       {
                           (this.props.postCodeBillingError == null && this.props.postCodeBilling)
                               ?
                               <Icon
                                   className={"inputIconShippingOk"}
                                   name="check"/>
                               :
                               <Icon
                                   className={this.props.postCodeBillingError == null ? "inputIconHidden" : "inputIconError"}
                                   name="times-circle-o"/>
                       }
                   </div>
               </div>
           </div>
        )
    }
}


const mapStateToProps = (state) =>{

    return {
        ...state.users,
        ...state.form.addressBilling,
        shippingAddress:state.form.address,
        ...state.errors.addressBillingErrors,
        customerErrors: state.errors.customerErrors,
        ...state.cart,
        customer: state.form.customer,
        billingAddress: state.form.addressBilling,
        collect: state.collect,
        ...state.errors.cartErrors
    }
};

const mapDispatchToProps = (dispatch) =>{

    return Object.assign( {}, bindActionCreators( {
        requestCheckoutData,
        setFirstNameBilling : customerActions.setFirstName,
        setLastNameBilling : customerActions.setLastName,
        setCompany : billingActions.setCompany,
        setAddress : billingActions.setAddress,
        setOptionalAddress : billingActions.setOptionalAddress,
        setCity : billingActions.setCity,
        setCountry : billingActions.setCountry,
        setPhone : customerActions.setPhone,
        setShipping : billingActions.setShipping,
        setShippingMethod : billingActions.setShippingMethod,
        setPostCodeBilling: billingActions.setPostCodeBilling,
        setBillingAddressString: billingActions.setBillingAddressString,
        setBillingAddressAutocompleteOpen: billingActions.setBillingAddressAutocompleteOpen,
        setShortCountry: billingActions.setShortCountry,
        fetchPostCodeAddress: customerActions.fetchPostCodeAddress,
        retrievePostCodeAddress: customerActions.retrievePostCodeAddress,
        setCityError: billingErrorsActions.setCityError,
        setCountryError: billingErrorsActions.setCountryError,
        setPostCodeBillingError: billingErrorsActions.setPostCodeBillingError,
        setBillingAddressError: billingErrorsActions.setAddressError,
        setShipment,
        setTotal,
        setStepperIndex,
        setStepFinished,
        setShowPayment,
        setManual,
        setManualAddress,
        setFlag: billingActions.setFlag,
        setAddressRestricted,
    }, dispatch ), {});
};

export default connect(mapStateToProps, mapDispatchToProps)(ManualBillingAddress);
