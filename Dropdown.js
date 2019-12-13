import React from "react";
import FontAwesome from "react-fontawesome";
import "./Dropdown.css";
import onClickOutside from "react-onclickoutside";
import {connect} from "react-redux";

export class Dropdown extends React.Component{

    constructor(props){
        super(props)
        this.state = {
            listOpen: false,
            headerTitle: 'Select country',
        }
    }

    handleClickOutside(){
        this.setState({
            listOpen: false
        })
    }


    toggleList(){
        this.setState(prevState => ({
            listOpen: !prevState.listOpen
        }))
    }

    handleClick = (index) => {
        this.props.toggleItem(index);
        this.setState({
            listOpen: false
        })
    }

    render(){
        const flagStyle = {width:"24px",height:"24px",borderRadius:"50%",objectFit:"cover",marginRight:"37px",verticalAlign:"top"}
        const list =   this.props.list;
        const{listOpen, headerTitle} = this.state

        return(
            <div className={this.props.errorClass ? this.props.errorClass + " dd-wrapper" : "dd-wrapper"}  id="countries-list">
                <div className="dd-header"  id="countries-list-header" onClick={() => this.toggleList()}>
                    <div className="dd-header-title">
                        <img src={this.props.flag}  className="flag" alt=""/>{this.props.title}
                    </div>
                    {listOpen
                        ? <FontAwesome id="angle-up" name="angle-up" size="2x"/>
                        : <FontAwesome id="angle-down" name="angle-down" size="2x"/>
                    }
                </div>
                {
                    listOpen &&
                    <ul className="dd-list">
                        {list.map((item, index) => (
                            <li
                                className="dd-list-item"
                                key={index}
                                onClick={() => this.handleClick(index)}
                            >
                                <img src={item.img_svg}  alt=""/>
                                {item.country}
                            </li>

                        ))}
                    </ul>
                }
            </div>
        )
    }
}

const mapStateToProps = ( state ) => {
    return{
        ...state.ui.countryDropdown
    }
};

export default connect(mapStateToProps) (onClickOutside(Dropdown));
