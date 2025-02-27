import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withSnackbar } from 'notistack';
import * as notificationActions from '../../actions/notificationActions';
import { config } from '../../config';
import Button from '@material-ui/core/Button';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import { FormattedMessage } from 'react-intl';

class Notifications extends Component
{
	displayed = [];

	storeDisplayed = (id) =>
	{
		this.displayed = [ ...this.displayed, id ];
	};

	shouldComponentUpdate({ notifications: newNotifications = [] })
	{
		const { notifications: currentNotifications } = this.props;

		let notExists = false;

		for (let i = 0; i < newNotifications.length; i += 1)
		{
			if (notExists) continue;

			notExists = notExists ||
				!currentNotifications.filter(
					({ id }) => newNotifications[i].id === id).length ||
				currentNotifications.filter(
					({ id }) =>
						(
							newNotifications[i].id === id &&
							newNotifications[i].toBeClosed === true
						)
				).length;

		}

		return notExists;
	}

	componentDidUpdate()
	{
		const { notifications = [] } = this.props;

		notifications.forEach((notification) =>
		{
			// needed for persistent notifications
			if (notification.toBeClosed)
			{
				this.props.closeSnackbar(notification.id);

				return;
			}

			// Do nothing if snackbar is already displayed
			if (this.displayed.includes(notification.id)) return;

			// customized
			const okAction = (key) => (
				<Fragment>
					<Button
						variant='contained'
						size='small'
						color='default'
						startIcon={<VerifiedUserIcon />}
						onClick={() => { this.props.closeSnackbar(key); }}
					>
						<FormattedMessage id='room.consentUnderstand' defaultMessage='I understand' />
					</Button>
				</Fragment>
			);

			// Display snackbar using notistack
			this.props.enqueueSnackbar(notification.text,
				{
					variant          : notification.type,
					autoHideDuration : notification.timeout,
					persist          : notification.persist,
					key              : notification.id,
					action           : notification.persist? okAction: null,
					anchorOrigin     : {
						vertical   : 'bottom',
						horizontal : config.notificationPosition
					}
				}
			);

			// Keep track of snackbars that we've displayed
			this.storeDisplayed(notification.id);

			// Dispatch action to remove snackbar from redux store
			this.props.removeNotification(notification.id);
		});

	}

	render()
	{
		return null;
	}
}

Notifications.propTypes =
{
	notifications      : PropTypes.array.isRequired,
	closeNotification  : PropTypes.func.isRequired,
	enqueueSnackbar    : PropTypes.func.isRequired,
	closeSnackbar      : PropTypes.func.isRequired,
	removeNotification : PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
	({
		notifications : state.notifications
	});

const mapDispatchToProps = (dispatch) =>
	({
		removeNotification : (notificationId) =>
			dispatch(notificationActions.removeNotification({ notificationId })),
		closeNotification : (notificationId) =>
			dispatch(notificationActions.closeNotification({ notificationId }))
	});

export default withSnackbar(
	connect(
		mapStateToProps,
		mapDispatchToProps,
		null,
		{
			areStatesEqual : (next, prev) =>
			{
				return (
					prev.notifications === next.notifications
				);
			}
		}
	)(Notifications)
);
