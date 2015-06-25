/**
 * Created by Roman on 23.02.2015.
 */

module.exports = function ( ) {
    //ToDo load constants
    var DEFAULT_ERROR_NAME = 'Error';
    var DEFAULT_ERROR_MESSAGE = 'error';
    var DEFAULT_ERROR_STATUS = 400;

    var NOT_ENAUGH_PARAMS = "Not enough incoming parameters.";
    var INVALID_EMAIL = "Invalid email address.";
    var EMAIL_IN_USE = 'Email in use. Please input another email address.';
    var NO_UPDATE_PARAMS = 'There are no params for update';

    function CustomError( options ) {
        //http://j-query.blogspot.com/2014/03/custom-error-objects-in-javascript.html
        Error.captureStackTrace( this );
        this.name =    ( options && options.name ) ? options.name : DEFAULT_ERROR_NAME;
        this.message = ( options && options.message ) ? options.message : DEFAULT_ERROR_MESSAGE;
        this.status =  ( options && options.status ) ? options.status : DEFAULT_ERROR_STATUS;
    }
    CustomError.prototype = Object.create( Error.prototype );

    function notEnParams( options ) {
        var errOptions = ( options ) ? options : {};

        if ( !errOptions.name ) {
            errOptions.name = "NotEnoughIncomingParameters";
        }
        if ( !errOptions.message ) {
            errOptions.message = NOT_ENAUGH_PARAMS;
        }
        if ( options && options.reqParams ) {
            errOptions.message += 'This parameters are required: ' + options.reqParams;
        }

        return new CustomError( errOptions );
    }

    function invalidEmail( options ) {
        var errOptions = ( options ) ? options : {};

        if ( !errOptions.name ) {
            errOptions.name = "InvalidEmal";
        }
        if ( !errOptions.message ) {
            errOptions.message = INVALID_EMAIL;
        }

        return new CustomError( errOptions );
    }

    function emailInUse( options ) {
        var errOptions = ( options ) ? options : {};

        if ( !errOptions.name ) {
            errOptions.name = 'DoubledEmail';
        }
        if ( !errOptions.message ) {
            errOptions.message = EMAIL_IN_USE;
        }

        return new CustomError( errOptions );
    }

    function noUpdateParams( options ) {
        var errOptions = ( options ) ? options : {};

        if ( !errOptions.name ) {
            errOptions.name = 'NoUpdateParams';
        }
        if ( !errOptions.message ) {
            errOptions.message = NO_UPDATE_PARAMS;
        }

        return new CustomError( errOptions );
    }

    function invalidValue( options ) {
        var errOptions = ( options ) ? options : {};
        var errMessage;

        if ( !errOptions.name ) {
            errOptions.name = 'InvalidValue';
        }
        if ( !errOptions.message ) {
            errMessage = "Invalid value";
            if ( errOptions.value ) {
                errMessage += " " + options.value;
            }
            if ( errOptions.param ) {
                errMessage += " for '" + options.param + "'";
            }
            errOptions.message = errMessage;
        }

        return new CustomError( errOptions );
    }

    function notFound( options ) {
        var errOptions = ( options ) ? options : {};
        var errMessage ;

        if ( !errOptions.name ) {
            errOptions.name = 'NotFound';
        }
        if ( !errOptions.message ) {
            errMessage = "Not Found";
            if ( errOptions.target ) {
                errMessage += " " + errOptions.target;
            }
            if ( errOptions.searchParams ) {
                errMessage += " (" + errOptions.searchParams + ")";
            }
            errOptions.message = errMessage;
        }

        return new CustomError( errOptions );
    }

    function unconfirmedEmail( options ) {
        var errOptions = ( options ) ? options : {};

        if ( !errOptions.name ) {
            errOptions.name = 'UnconfirmedEmail';
        }
        if ( !errOptions.message ) {
            errOptions.message = 'Please confirm your account';
        }

        return new CustomError( errOptions );
    }

    function signInError( options ) {
        var errOptions = ( options ) ? options : {};

        if ( !errOptions.name ) {
            errOptions.name = 'SignInError';
        }
        if ( !errOptions.message ) {
            errOptions.message = 'Incorrect email or password';
        }
        if ( !errOptions.status ) {
            errOptions.status = DEFAULT_ERROR_STATUS;
        }

        return new CustomError( errOptions );
    }

    function accessError( options ) {
        var errOptions = ( options ) ? options : {};

        if ( !errOptions.name ) {
            errOptions.name = 'AccessError';
        }
        if ( !errOptions.message ) {
            errOptions.message = "You do not have sufficient rights";
        }

        return new CustomError( errOptions );
    }

    function invalidType( options ) {
        var errOptions = ( options ) ? options : {};

        if ( !errOptions.name ) {
            errOptions.name = 'InvalidType';
        }
        if ( !errOptions.message ) {
            errOptions.message = "Invalid type of variable";
        }

        return new CustomError( errOptions );
    }


    function unauthorized( options ) {
        var errOptions = ( options ) ? options : {};

        if ( !errOptions.name ) {
            errOptions.name = 'Unauthorized';
        }
        if ( !errOptions.message ) {
            errOptions.message = "Unauthorized";
        }
        if ( !errOptions.status ) {
            errOptions.status = 401;
        }

        return new CustomError( errOptions );
    }


    return {
        unauthorized: unauthorized,
        notEnParams: notEnParams,
        invalidEmail: invalidEmail,
        emailInUse: emailInUse,
        noUpdateParams: noUpdateParams,
        invalidValue: invalidValue,
        notFound: notFound,
        unconfirmedEmail: unconfirmedEmail,
        signInError: signInError,
        accessError: accessError
    }
};
