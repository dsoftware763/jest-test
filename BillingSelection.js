import React from 'react';
import {Card,  CardHeader, CardText} from 'material-ui/Card';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';


class BillingSelection extends React.Component {
    render() {
        return (
            <div>
                <Card>

                    <CardHeader
                        title="Billing Address"
                    />

                    <CardText>
                        <RadioButtonGroup name="paymentMethod">
                            <RadioButton
                                value="same"
                                label="Same as shipping address"
                            />
                            <RadioButton
                                value="different"
                                label="Use a different billing address"
                            />
                        </RadioButtonGroup>
                    </CardText>

                </Card>

            </div>
        );
    }
}


export default BillingSelection;
