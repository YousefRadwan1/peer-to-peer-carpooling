import React from 'react';
function Message() {
    const name = 'Dat';
    if (name) 
        return <h1>Hello {name}</h1>
    else return <h1>Hello World</h1>
}
export default Message;