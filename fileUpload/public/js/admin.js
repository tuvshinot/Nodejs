const deleteProduct = (btn) => {
    
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const crfs = btn.parentNode.querySelector('[name=_csrf]').value;
    const deletingElement = btn.closest('article');
    
    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token' : crfs
        }
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        // alert(data.message);
        deletingElement.remove();
    })
    .catch(err => console.log(err));

};

