import React from 'react';
import { Form, Field, withFormik } from 'formik';
import { object } from 'yup';

import Icon from '@mdi/react';
import { mdiInformation as warningIcon, mdiEmail as emailIcon } from '@mdi/js';

import { emailRule } from './validationRules';
import ErrorMessage from '../ErrorMessage';

const RequestResetForm = ({ errors, touched, isSubmitting }) => {
  const emailError = !!(touched.email && errors.email);

  return (
    <Form className="form">
      <fieldset
        className="form__fieldset"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {errors.apiError && <ErrorMessage error={errors.apiError} />}

        <div className="form__row">
          {emailError && (
            <div className="form__error-wrapper">
              <Icon path={warningIcon} className="form__warning-icon" />
              <p className="form__error-message">{errors.email}</p>
            </div>
          )}

          <div className="form__input-wrapper">
            <Icon path={emailIcon} className="form__input-icon" />
            <Field
              className={`form__input${
                emailError ? ' form__input--error' : ''
              }`}
              type="email"
              name="email"
              placeholder="Email"
            />
          </div>
        </div>
        <button
          className="btn btn--large"
          type="submit"
          disabled={isSubmitting}
        >
          Reset my password
        </button>
      </fieldset>
    </Form>
  );
};

const validationSchema = object().shape({
  email: emailRule,
});

export default withFormik({
  mapPropsToValues({ email, password }) {
    return {
      email: email || '',
      password: password || '',
    };
  },
  validationSchema,
  validateOnBlur: false,
  validateOnChange: false,
  handleSubmit: async (values, { props, setSubmitting }) => {
    try {
      await props.requestReset({
        variables: {
          ...values,
        },
      });
    } catch (error) {
      setSubmitting(false);
    }
  },
})(RequestResetForm);
