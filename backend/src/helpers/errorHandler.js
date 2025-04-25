const errorHandler = (err, req, res, next) => {

    if(res.headerSent){
        return next(err)
    }

    const  statusCode = res.statusCode >= 400 ? res.statusCode : 500
    res.status(statusCode)

    if(process.env.NODE_ENV === 'development'){
        res.json({
            message: err.message,
            stack: err.stack
        })
    }    
}

export default errorHandler;