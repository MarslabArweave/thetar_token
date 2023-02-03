import React from 'react';
import "./SubmitButton.css";
import { Loader, useToaster, Message, Button } from 'rsuite';

/*
 * @props buttonText: string.
 * @props block: boolean. Show as block element.
 * @props color: Color. Set button color.
 * @props submitTask: async function. Will be executed when button clicked.
 * @props buttonSize: string. Large | Medium | Small.
 * @props disabled: boolean.
 * @props(option) onFailed: function. Will be executed if submitTask returns {status: false, ...}
 * @props(option) onSuccess: function. Will be executed if submitTask returns {status: true, ...}
*/
export const SubmitButton = (props) => {
  const buttonSizeMap = {
    Small: 'sm',
    Medium: 'md',
    Large: 'lg'
  };

  const [disabled, setDisabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const toaster = useToaster();

  const toast = (type, message) => 
    <Message type={type} header={message} closable showIcon />

  async function onButtonClicked() {
    setDisabled(true);
    setLoading(true);
    props.submitTask().then(ret => {
      console.log('onButtonClicked ret: ', ret);
      setDisabled(false);
      setLoading(false);
      toaster.push(toast(ret.status === true ? 'success' : 'error', ret.result));
      if (ret.status === false) {
        if (props.onFailed) {
          props.onFailed(ret);
        }
        return;
      } else {
        if (props.onSuccess) {
          props.onSuccess(ret);
        }
      }
    });
  }
  
  return (
    <>
      {loading && <Loader center inverse backdrop content={props.buttonText+' ...'} style={{height: document.body.scrollHeight*1.8}} />}

      <div className='centerButton'>
        <Button 
          block={props.block}
          color={props.color} 
          appearance="primary"
          onClick={onButtonClicked}
          disabled={props.disabled===true?true:disabled} 
        >
          {props.buttonText}
        </Button>
      </div>
    </>
  );
}