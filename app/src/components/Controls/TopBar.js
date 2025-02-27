import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
	lobbyPeersKeySelector,
	peersLengthSelector,
	raisedHandsSelector,
	makePermissionSelector,
	recordingInProgressSelector
} from '../Selectors';
import { permissions } from '../../permissions';
import * as appPropTypes from '../appPropTypes';
import { withRoomContext } from '../../RoomContext';
import { withStyles } from '@material-ui/core/styles';
import * as roomActions from '../../actions/roomActions';
import * as toolareaActions from '../../actions/toolareaActions';
import * as notificationActions from '../../actions/notificationActions';
import { useIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Badge from '@material-ui/core/Badge';
import Paper from '@material-ui/core/Paper';
import AccountCircle from '@material-ui/icons/AccountCircle';
import FullScreenIcon from '@material-ui/icons/Fullscreen';
import FullScreenExitIcon from '@material-ui/icons/FullscreenExit';
import SettingsIcon from '@material-ui/icons/Settings';
import SecurityIcon from '@material-ui/icons/Security';
import PeopleIcon from '@material-ui/icons/People';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import VideoCallIcon from '@material-ui/icons/VideoCall';
import SelfViewOnIcon from '@material-ui/icons/Videocam';
import SelfViewOffIcon from '@material-ui/icons/VideocamOff';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import MoreIcon from '@material-ui/icons/MoreVert';
import HelpIcon from '@material-ui/icons/Help';
import InfoIcon from '@material-ui/icons/Info';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import PauseCircleOutlineIcon from '@material-ui/icons/PauseCircleOutline';
import PauseCircleFilledIcon from '@material-ui/icons/PauseCircleFilled';
import StopIcon from '@material-ui/icons/Stop';
import randomString from 'random-string';
import { recorder, RECORDING_START, RECORDING_PAUSE, RECORDING_RESUME } from '../../actions/recorderActions';
import * as meActions from '../../actions/meActions';
import { store } from '../../store';
// import producers from '../../reducers/producers';
// import logger from 'redux-logger';
import Logger from '../../Logger';
import { config } from '../../config';

const logger = new Logger('Recorder');

const styles = (theme) =>
	({
		persistentDrawerOpen :
		{
			width                          : 'calc(100% - 30vw)',
			marginLeft                     : '30vw',
			[theme.breakpoints.down('lg')] :
			{
				width      : 'calc(100% - 30vw)',
				marginLeft : '40vw'
			},
			[theme.breakpoints.down('md')] :
			{
				width      : 'calc(100% - 40vw)',
				marginLeft : '50vw'
			},
			[theme.breakpoints.down('sm')] :
			{
				width      : 'calc(100% - 60vw)',
				marginLeft : '70vw'
			},
			[theme.breakpoints.down('xs')] :
			{
				width      : 'calc(100% - 80vw)',
				marginLeft : '90vw'
			}
		},
		menuButton :
		{
			margin  : 0,
			padding : 0
		},
		logo :
		{
			display                      : 'none',
			marginLeft                   : 20,
			[theme.breakpoints.up('sm')] :
			{
				display : 'block'
			}
		},
		divider :
		{
			marginLeft : theme.spacing(3)
		},
		show :
		{
			opacity    : 1,
			transition : 'opacity .5s'
		},
		hide :
		{
			opacity    : 0,
			transition : 'opacity .5s'
		},
		grow :
		{
			flexGrow : 1
		},
		title :
		{
			display                      : 'none',
			marginLeft                   : 20,
			[theme.breakpoints.up('sm')] :
			{
				display : 'block'
			}
		},
		sectionDesktop : {
			display                      : 'none',
			[theme.breakpoints.up('md')] : {
				display : 'flex'
			}
		},
		sectionMobile : {
			display                      : 'flex',
			[theme.breakpoints.up('md')] : {
				display : 'none'
			}
		},
		actionButton :
		{
			margin  : theme.spacing(1, 0),
			padding : theme.spacing(0, 1)
		},
		disabledButton :
		{
			margin : theme.spacing(1, 0)
		},
		green :
		{
			color : 'rgba(0, 153, 0, 1)'
		},
		moreAction :
		{
			margin : theme.spacing(0.5, 0, 0.5, 1.5)
		}
	});

const PulsingBadge = withStyles((theme) =>
	({
		badge :
		{
			backgroundColor : theme.palette.secondary.main,
			'&::after'      :
			{
				position     : 'absolute',
				width        : '100%',
				height       : '100%',
				borderRadius : '50%',
				animation    : '$ripple 1.2s infinite ease-in-out',
				border       : `3px solid ${theme.palette.secondary.main}`,
				content      : '""'
			}
		},
		'@keyframes ripple' :
		{
			'0%' :
			{
				transform : 'scale(.8)',
				opacity   : 1
			},
			'100%' :
			{
				transform : 'scale(2.4)',
				opacity   : 0
			}
		}
	}))(Badge);

const RecIcon = withStyles(() =>
	({
		root :
		{
			animation : '$pulse 2s infinite ease-in-out'
		},
		'@keyframes pulse' :
		{
			'0%' :
			{
				transform : 'scale(.8)',
				opacity   : 1
			},
			'100%' :
			{
				transform : 'scale(1.2)',
				opacity   : 0
			}
		}
	}))(FiberManualRecordIcon);

const TopBar = (props) =>
{
	const intl = useIntl();
	const [ mobileMoreAnchorEl, setMobileMoreAnchorEl ] = useState(null);
	const [ anchorEl, setAnchorEl ] = useState(null);
	const [ currentMenu, setCurrentMenu ] = useState(null);
	const [ recordingConsentNotificationId,
		setRecordingConsentNotificationId ] = useState(null);

	const handleExited = () =>
	{
		setCurrentMenu(null);
	};

	const handleMobileMenuOpen = (event) =>
	{
		setMobileMoreAnchorEl(event.currentTarget);
	};

	const handleMobileMenuClose = () =>
	{
		setMobileMoreAnchorEl(null);
	};

	const handleMenuOpen = (event, menu) =>
	{
		setAnchorEl(event.currentTarget);
		setCurrentMenu(menu);
	};

	const handleMenuClose = () =>
	{
		setAnchorEl(null);

		handleMobileMenuClose();
	};

	const {
		roomClient,
		room,
		peersLength,
		lobbyPeers,
		permanentTopBar,
		drawerOverlayed,
		toolAreaOpen,
		isSafari,
		isMobile,
		loggedIn,
		loginEnabled,
		fullscreenEnabled,
		fullscreen,
		onFullscreen,
		setSettingsOpen,
		setExtraVideoOpen,
		setHelpOpen,
		setAboutOpen,
		setLeaveOpen,
		setLockDialogOpen,
		setHideSelfView,
		toggleToolArea,
		openUsersTab,
		addNotification,
		closeNotification,
		unread,
		canProduceExtraVideo,
		canLock,
		canPromote,
		classes,
		locale,
		localesList,
		localRecordingState,
		recordingInProgress,
		producers,
		consumers
	} = props;

	// did it change?
	recorder.checkMicProducer(producers);
	recorder.checkAudioConsumer(consumers);

	useEffect(() =>
	{
		if (
			recordingInProgress &&
			!recordingConsentNotificationId)
		{
			const notificationId = randomString({ length: 6 }).toLowerCase();

			setRecordingConsentNotificationId(notificationId);
			addNotification(
				{
					id   : notificationId,
					type : 'warning',
					text :
					intl.formatMessage(
						{
							id             : 'room.recordingConsent',
							defaultMessage : 'When attending this meeting you agree and give your consent that the meeting will be audio and video recorded and/or live broadcasted through web streaming'
						}
					),
					persist : true
				}
			);
		}
		if (
			!recordingInProgress
			&& recordingConsentNotificationId)
		{
			closeNotification(recordingConsentNotificationId);
			setRecordingConsentNotificationId(null);
		}
	},
	[
		localRecordingState, recordingInProgress, recordingConsentNotificationId,
		addNotification, closeNotification, intl
	]);

	const isMenuOpen = Boolean(anchorEl);
	const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

	const lockTooltip = room.locked ?
		intl.formatMessage({
			id             : 'tooltip.unLockRoom',
			defaultMessage : 'Unlock room'
		})
		:
		intl.formatMessage({
			id             : 'tooltip.lockRoom',
			defaultMessage : 'Lock room'
		});

	const recordingTooltip = (localRecordingState === RECORDING_START ||
								localRecordingState === RECORDING_RESUME) ?
		intl.formatMessage({
			id             : 'tooltip.stopLocalRecording',
			defaultMessage : 'Stop local recording'
		})
		:
		intl.formatMessage({
			id             : 'tooltip.startLocalRecording',
			defaultMessage : 'Start local recording'
		});

	const recordingPausedTooltip = localRecordingState === RECORDING_PAUSE ?
		intl.formatMessage({
			id             : 'tooltip.resumeLocalRecording',
			defaultMessage : 'Resume local recording'
		})
		:
		intl.formatMessage({
			id             : 'tooltip.pauseLocalRecording',
			defaultMessage : 'Pause local recording.'
		});

	const fullscreenTooltip = fullscreen ?
		intl.formatMessage({
			id             : 'tooltip.leaveFullscreen',
			defaultMessage : 'Leave fullscreen'
		})
		:
		intl.formatMessage({
			id             : 'tooltip.enterFullscreen',
			defaultMessage : 'Enter fullscreen'
		});

	const loginTooltip = loggedIn ?
		intl.formatMessage({
			id             : 'tooltip.logout',
			defaultMessage : 'Log out'
		})
		:
		intl.formatMessage({
			id             : 'tooltip.login',
			defaultMessage : 'Log in'
		});

	return (
		<React.Fragment>
			<AppBar
				position='fixed'
				className={classnames(
					room.toolbarsVisible || permanentTopBar ?
						classes.show : classes.hide,
					!(isMobile || drawerOverlayed) && toolAreaOpen ?
						classes.persistentDrawerOpen : null
				)}
			>
				<Toolbar>
					<PulsingBadge
						color='secondary'
						badgeContent={unread}
						onClick={() => toggleToolArea()}
					>
						<IconButton
							color='inherit'
							aria-label={intl.formatMessage({
								id             : 'label.openDrawer',
								defaultMessage : 'Open drawer'
							})}
							className={classes.menuButton}
						>
							<MenuIcon />
						</IconButton>
					</PulsingBadge>
					{ config.logo !=='' ?
						<img alt='Logo'
							src={config.logo}
							className={classes.logo}
						/> :
						<Typography
							variant='h6'
							noWrap color='inherit'
						>
							{config.title}
						</Typography>
					}
					<div className={classes.grow} />
					<div className={classes.sectionDesktop}>
						{ recordingInProgress &&
						<IconButton
							disabled
							color='inherit'
							aria-label={intl.formatMessage(
								{
									id             : 'label.recordingInProgress',
									defaultMessage : 'Recording in Progress..'
								})}
							className={classes.menuButton}
						>
							<RecIcon color='secondary' />
						</IconButton>
						}
						<div className={classes.divider} />
						<Tooltip
							title={intl.formatMessage({
								id             : 'label.moreActions',
								defaultMessage : 'More actions'
							})}
						>
							<IconButton
								aria-owns={
									isMenuOpen &&
									currentMenu === 'moreActions' ?
										'material-appbar' : undefined
								}
								aria-haspopup
								onClick={(event) => handleMenuOpen(event, 'moreActions')}
								color='inherit'
							>
								<MoreIcon />
							</IconButton>
						</Tooltip>
						{ fullscreenEnabled &&
							<Tooltip title={fullscreenTooltip}>
								<IconButton
									aria-label={intl.formatMessage({
										id             : 'tooltip.enterFullscreen',
										defaultMessage : 'Enter fullscreen'
									})}
									className={classes.actionButton}
									color='inherit'
									onClick={onFullscreen}
								>
									{ fullscreen ?
										<FullScreenExitIcon />
										:
										<FullScreenIcon />
									}
								</IconButton>
							</Tooltip>
						}
						<Tooltip
							title={intl.formatMessage({
								id             : 'tooltip.participants',
								defaultMessage : 'Show participants'
							})}
						>
							<IconButton
								aria-label={intl.formatMessage({
									id             : 'tooltip.participants',
									defaultMessage : 'Show participants'
								})}
								color='inherit'
								onClick={() => openUsersTab()}
							>
								<Badge
									color='primary'
									badgeContent={peersLength + 1}
								>
									<PeopleIcon />
								</Badge>
							</IconButton>
						</Tooltip>
						<Tooltip
							title={intl.formatMessage({
								id             : 'tooltip.settings',
								defaultMessage : 'Show settings'
							})}
						>
							<IconButton
								aria-label={intl.formatMessage({
									id             : 'tooltip.settings',
									defaultMessage : 'Show settings'
								})}
								className={classes.actionButton}
								color='inherit'
								onClick={() => setSettingsOpen(!room.settingsOpen)}
							>
								<SettingsIcon />
							</IconButton>
						</Tooltip>
						<Tooltip title={lockTooltip}>
							<span className={classes.disabledButton}>
								<IconButton
									aria-label={intl.formatMessage({
										id             : 'tooltip.lockRoom',
										defaultMessage : 'Lock room'
									})}
									className={classes.actionButton}
									color='inherit'
									disabled={!canLock}
									onClick={() =>
									{
										if (room.locked)
										{
											roomClient.unlockRoom();
										}
										else
										{
											roomClient.lockRoom();
										}
									}}
								>
									{ room.locked ?
										<LockIcon />
										:
										<LockOpenIcon />
									}
								</IconButton>
							</span>
						</Tooltip>
						{ lobbyPeers.length > 0 &&
							<Tooltip
								title={intl.formatMessage({
									id             : 'tooltip.lobby',
									defaultMessage : 'Show lobby'
								})}
							>
								<span className={classes.disabledButton}>
									<IconButton
										aria-label={intl.formatMessage({
											id             : 'tooltip.lobby',
											defaultMessage : 'Show lobby'
										})}
										className={classes.actionButton}
										color='inherit'
										disabled={!canPromote}
										onClick={() => setLockDialogOpen(!room.lockDialogOpen)}
									>
										<PulsingBadge
											color='secondary'
											badgeContent={lobbyPeers.length}
										>
											<SecurityIcon />
										</PulsingBadge>
									</IconButton>
								</span>
							</Tooltip>
						}
						{ loginEnabled &&
							<Tooltip title={loginTooltip}>
								<IconButton
									aria-label={intl.formatMessage({
										id             : 'tooltip.login',
										defaultMessage : 'Log in'
									})}
									className={classes.actionButton}
									color='inherit'
									onClick={() =>
									{
										loggedIn ? roomClient.logout() : roomClient.login();
									}}
								>
									<AccountCircle className={loggedIn ? classes.green : null} />
								</IconButton>
							</Tooltip>
						}
					</div>
					<div className={classes.sectionMobile}>
						{ lobbyPeers.length > 0 &&
						<Tooltip
							title={intl.formatMessage({
								id             : 'tooltip.lobby',
								defaultMessage : 'Show lobby'
							})}
						>
							<span className={classes.disabledButton}>
								<IconButton
									aria-label={intl.formatMessage({
										id             : 'tooltip.lobby',
										defaultMessage : 'Show lobby'
									})}
									className={classes.actionButton}
									color='inherit'
									disabled={!canPromote}
									onClick={() => setLockDialogOpen(!room.lockDialogOpen)}
								>
									<PulsingBadge
										color='secondary'
										badgeContent={lobbyPeers.length}
									>
										<SecurityIcon />
									</PulsingBadge>
								</IconButton>
							</span>
						</Tooltip>
						}
						<IconButton
							aria-haspopup
							onClick={handleMobileMenuOpen}
							color='inherit'
						>
							<MoreIcon />
						</IconButton>
					</div>
					<div className={classes.divider} />

					<Button
						aria-label={locale.split(/[-_]/)[0]}
						className={classes.actionButton}
						color='secondary'
						disableRipple
						onClick={(event) => handleMenuOpen(event, 'localeMenu')}
					>
						{locale.split(/[-_]/)[0]}
					</Button>

					<Button
						aria-label={intl.formatMessage({
							id             : 'label.leave',
							defaultMessage : 'Leave'
						})}
						className={classes.actionButton}
						variant='contained'
						color='secondary'
						onClick={() => setLeaveOpen(!room.leaveOpen)}
					>
						<FormattedMessage
							id='label.leave'
							defaultMessage='Leave'
						/>
					</Button>
				</Toolbar>
			</AppBar>
			<Popover
				anchorEl={anchorEl}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
				open={isMenuOpen}
				onClose={handleMenuClose}
				onExited={handleExited}
				getContentAnchorEl={null}
			>
				{ currentMenu === 'moreActions' &&
					<Paper>
						{
							(
								localRecordingState === RECORDING_START ||
								localRecordingState === RECORDING_RESUME ||
								localRecordingState === RECORDING_PAUSE
							)
							&&
							<MenuItem
								aria-label={recordingPausedTooltip}
								onClick={() =>
								{
									handleMenuClose();
									if (localRecordingState === RECORDING_PAUSE)
									{
										recorder.resumeLocalRecording();
									}
									else
									{
										recorder.pauseLocalRecording();
									}
								}
								}
							>
								<Badge
									color='primary'
								>
									{ localRecordingState === RECORDING_PAUSE ?
										<PauseCircleFilledIcon />
										:
										<PauseCircleOutlineIcon />
									}
								</Badge>
								{ localRecordingState === RECORDING_PAUSE ?
									<p className={classes.moreAction}>
										<FormattedMessage
											id='tooltip.resumeLocalRecording'
											defaultMessage='Resume local recording'
										/>
									</p>
									:
									<p className={classes.moreAction}>
										<FormattedMessage
											id='tooltip.pauseLocalRecording'
											defaultMessage='Pause local recording'
										/>
									</p>
								}

							</MenuItem>
						}
						{ isSafari &&
						<MenuItem
							aria-label={recordingTooltip}
							onClick={async () =>
							{
								handleMenuClose();
								if (localRecordingState === RECORDING_START ||
									localRecordingState === RECORDING_PAUSE ||
									localRecordingState === RECORDING_RESUME)
								{
									recorder.stopLocalRecording();
								}
								else
								{

									try
									{
										const recordingMimeType =
										store.getState().settings.recorderPreferredMimeType;
										const additionalAudioTracks = [];
										const micProducer = Object.values(producers).find((p) => p.source === 'mic');

										if (micProducer) additionalAudioTracks.push(micProducer.track);
										await recorder.startLocalRecording({
											roomClient : roomClient.room,
											additionalAudioTracks,
											recordingMimeType
										});

										recorder.checkAudioConsumer(consumers);

										meActions.setLocalRecordingState(RECORDING_START);
									}
									catch (err)
									{
										logger.error('Error during starting the recording! error:%O', err.message);
									}

								}
							}
							}
						>
							<Badge
								color='primary'
							>
								{
									(localRecordingState === RECORDING_START ||
									localRecordingState === RECORDING_PAUSE ||
									localRecordingState === RECORDING_RESUME) ?
										<StopIcon />
										:
										<FiberManualRecordIcon />
								}
							</Badge>

							{
								(localRecordingState === RECORDING_START ||
								localRecordingState === RECORDING_PAUSE ||
								localRecordingState === RECORDING_RESUME) ?
									<p className={classes.moreAction}>
										<FormattedMessage
											id='tooltip.stopLocalRecording'
											defaultMessage='Stop local recording'
										/>
									</p>
									:
									<p className={classes.moreAction}>
										<FormattedMessage
											id='tooltip.startLocalRecording'
											defaultMessage='Start local recording'
										/>
									</p>
							}

						</MenuItem>
						}
						<MenuItem
							disabled={!canProduceExtraVideo}
							onClick={() =>
							{
								handleMenuClose();
								setExtraVideoOpen(!room.extraVideoOpen);
							}}
						>
							<VideoCallIcon
								aria-label={intl.formatMessage({
									id             : 'label.addVideo',
									defaultMessage : 'Add video'
								})}
							/>
							<p className={classes.moreAction}>
								<FormattedMessage
									id='label.addVideo'
									defaultMessage='Add video'
								/>
							</p>
						</MenuItem>
						<MenuItem
							onClick={() =>
							{
								handleMenuClose();
								setHideSelfView(!room.hideSelfView);
							}}
						>
							{ room.hideSelfView ?
								<SelfViewOnIcon
									aria-label={intl.formatMessage({
										id             : 'room.showSelfView',
										defaultMessage : 'Show self view video'
									})}
								/>
								:
								<SelfViewOffIcon
									aria-label={intl.formatMessage({
										id             : 'room.hideSelfView',
										defaultMessage : 'Hide self view video'
									})}
								/>
							}
							{ room.hideSelfView ?
								<p className={classes.moreAction}>
									<FormattedMessage
										id='room.showSelfView'
										defaultMessage='Show self view video'
									/>
								</p>
								:
								<p className={classes.moreAction}>
									<FormattedMessage
										id='room.hideSelfView'
										defaultMessage='Hide self view video'
									/>
								</p>
							}
						</MenuItem>
						<MenuItem
							onClick={() =>
							{
								handleMenuClose();
								setHelpOpen(!room.helpOpen);
							}}
						>
							<HelpIcon
								aria-label={intl.formatMessage({
									id             : 'room.help',
									defaultMessage : 'Help'
								})}
							/>
							<p className={classes.moreAction}>
								<FormattedMessage
									id='room.help'
									defaultMessage='Help'
								/>
							</p>
						</MenuItem>
						<MenuItem
							onClick={() =>
							{
								handleMenuClose();
								setAboutOpen(!room.aboutOpen);
							}}
						>
							<InfoIcon
								aria-label={intl.formatMessage({
									id             : 'room.about',
									defaultMessage : 'About'
								})}
							/>
							<p className={classes.moreAction}>
								<FormattedMessage
									id='room.about'
									defaultMessage='About'
								/>
							</p>
						</MenuItem>
					</Paper>
				}

				{ currentMenu === 'localeMenu' &&
					<Paper>
						{localesList.map((item, index) => (
							<MenuItem
								selected={item.locale.includes(locale)}
								key={index}
								onClick={() =>
								{
									roomClient.setLocale(item.locale[0]);
									handleMenuClose();
								}}
							>
								{item.name}
							</MenuItem>)
						)}
					</Paper>
				}

			</Popover>
			<Menu
				anchorEl={mobileMoreAnchorEl}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				open={isMobileMenuOpen}
				onClose={handleMenuClose}
				getContentAnchorEl={null}

			>
				{ loginEnabled &&
					<MenuItem
						aria-label={loginTooltip}
						onClick={() =>
						{
							handleMenuClose();
							loggedIn ? roomClient.logout() : roomClient.login();
						}}
					>
						<AccountCircle className={loggedIn ? classes.green : null} />
						{ loggedIn ?
							<p className={classes.moreAction}>
								<FormattedMessage
									id='tooltip.logout'
									defaultMessage='Log out'
								/>
							</p>
							:
							<p className={classes.moreAction}>
								<FormattedMessage
									id='tooltip.login'
									defaultMessage='Log in'
								/>
							</p>
						}
					</MenuItem>
				}
				{
					(
						localRecordingState === RECORDING_PAUSE ||
						localRecordingState === RECORDING_RESUME ||
						localRecordingState === RECORDING_START
					)
					&&
					<MenuItem

						aria-label={recordingPausedTooltip}
						onClick={() =>
						{
							handleMenuClose();
							if (localRecordingState === RECORDING_PAUSE)
							{
								recorder.resumeLocalRecording();
							}
							else
							{
								recorder.pauseLocalRecording();
							}
						}
						}
					>
						<Badge
							color='primary'
						>
							{ localRecordingState === RECORDING_PAUSE ?
								<PauseCircleFilledIcon />
								:
								<PauseCircleOutlineIcon />
							}
						</Badge>

						{ localRecordingState === RECORDING_PAUSE ?
							<p className={classes.moreAction}>
								<FormattedMessage
									id='tooltip.resumeLocalRecording'
									defaultMessage='Resume local recording'
								/>
							</p>
							:
							<p className={classes.moreAction}>
								<FormattedMessage
									id='tooltip.pauseLocalRecording'
									defaultMessage='Pause local recording'
								/>
							</p>
						}

					</MenuItem>

				}
				<MenuItem
					aria-label={lockTooltip}
					disabled={!canLock}
					onClick={() =>
					{
						handleMenuClose();

						if (room.locked)
						{
							roomClient.unlockRoom();
						}
						else
						{
							roomClient.lockRoom();
						}
					}}
				>
					{ room.locked ?
						<LockIcon />
						:
						<LockOpenIcon />
					}
					{ room.locked ?
						<p className={classes.moreAction}>
							<FormattedMessage
								id='tooltip.unLockRoom'
								defaultMessage='Unlock room'
							/>
						</p>
						:
						<p className={classes.moreAction}>
							<FormattedMessage
								id='tooltip.lockRoom'
								defaultMessage='Lock room'
							/>
						</p>
					}
				</MenuItem>
				<MenuItem
					aria-label={intl.formatMessage({
						id             : 'tooltip.settings',
						defaultMessage : 'Show settings'
					})}
					onClick={() =>
					{
						handleMenuClose();
						setSettingsOpen(!room.settingsOpen);
					}}
				>
					<SettingsIcon />
					<p className={classes.moreAction}>
						<FormattedMessage
							id='tooltip.settings'
							defaultMessage='Show settings'
						/>
					</p>
				</MenuItem>
				<MenuItem
					aria-label={intl.formatMessage({
						id             : 'tooltip.participants',
						defaultMessage : 'Show participants'
					})}
					onClick={() =>
					{
						handleMenuClose();
						openUsersTab();
					}}
				>
					<Badge
						color='primary'
						badgeContent={peersLength + 1}
					>
						<PeopleIcon />
					</Badge>
					<p className={classes.moreAction}>
						<FormattedMessage
							id='tooltip.participants'
							defaultMessage='Show participants'
						/>
					</p>
				</MenuItem>
				{ fullscreenEnabled &&
					<MenuItem
						aria-label={intl.formatMessage({
							id             : 'tooltip.enterFullscreen',
							defaultMessage : 'Enter fullscreen'
						})}
						onClick={() =>
						{
							handleMenuClose();
							onFullscreen();
						}}
					>
						{ fullscreen ?
							<FullScreenExitIcon />
							:
							<FullScreenIcon />
						}
						<p className={classes.moreAction}>
							<FormattedMessage
								id='tooltip.enterFullscreen'
								defaultMessage='Enter fullscreen'
							/>
						</p>
					</MenuItem>
				}
				<MenuItem
					disabled={!canProduceExtraVideo}
					onClick={() =>
					{
						handleMenuClose();
						setExtraVideoOpen(!room.extraVideoOpen);
					}}
				>
					<VideoCallIcon
						aria-label={intl.formatMessage({
							id             : 'label.addVideo',
							defaultMessage : 'Add video'
						})}
					/>
					<p className={classes.moreAction}>
						<FormattedMessage
							id='label.addVideo'
							defaultMessage='Add video'
						/>
					</p>
				</MenuItem>
				<MenuItem
					onClick={() =>
					{
						handleMenuClose();
						setHideSelfView(!room.hideSelfView);
					}}
				>
					{ room.hideSelfView ?
						<SelfViewOnIcon
							aria-label={intl.formatMessage({
								id             : 'room.showSelfView',
								defaultMessage : 'Show self view video'
							})}
						/>
						:
						<SelfViewOffIcon
							aria-label={intl.formatMessage({
								id             : 'room.hideSelfView',
								defaultMessage : 'Hide self view video'
							})}
						/>
					}
					{ room.hideSelfView ?
						<p className={classes.moreAction}>
							<FormattedMessage
								id='room.showSelfView'
								defaultMessage='Show self view video'
							/>
						</p>
						:
						<p className={classes.moreAction}>
							<FormattedMessage
								id='room.hideSelfView'
								defaultMessage='Hide self view video'
							/>
						</p>
					}
				</MenuItem>
				<MenuItem
					onClick={() =>
					{
						handleMenuClose();
						setHelpOpen(!room.helpOpen);
					}}
				>
					<HelpIcon
						aria-label={intl.formatMessage({
							id             : 'room.help',
							defaultMessage : 'Help'
						})}
					/>
					<p className={classes.moreAction}>
						<FormattedMessage
							id='room.help'
							defaultMessage='Help'
						/>
					</p>
				</MenuItem>
				<MenuItem
					onClick={() =>
					{
						handleMenuClose();
						setAboutOpen(!room.aboutOpen);
					}}
				>
					<InfoIcon
						aria-label={intl.formatMessage({
							id             : 'room.about',
							defaultMessage : 'About'
						})}
					/>
					<p className={classes.moreAction}>
						<FormattedMessage
							id='room.about'
							defaultMessage='About'
						/>
					</p>
				</MenuItem>
			</Menu>
		</React.Fragment>
	);
};

TopBar.propTypes =
{
	roomClient           : PropTypes.object.isRequired,
	room                 : appPropTypes.Room.isRequired,
	isSafari         			 : PropTypes.bool,
	isMobile             : PropTypes.bool.isRequired,
	peersLength          : PropTypes.number,
	lobbyPeers           : PropTypes.array,
	permanentTopBar      : PropTypes.bool.isRequired,
	drawerOverlayed      : PropTypes.bool.isRequired,
	toolAreaOpen         : PropTypes.bool.isRequired,
	loggedIn             : PropTypes.bool.isRequired,
	loginEnabled         : PropTypes.bool.isRequired,
	fullscreenEnabled    : PropTypes.bool,
	fullscreen           : PropTypes.bool,
	onFullscreen         : PropTypes.func.isRequired,
	setToolbarsVisible   : PropTypes.func.isRequired,
	setSettingsOpen      : PropTypes.func.isRequired,
	setLeaveOpen         : PropTypes.func.isRequired,
	setExtraVideoOpen    : PropTypes.func.isRequired,
	setHelpOpen          : PropTypes.func.isRequired,
	setAboutOpen         : PropTypes.func.isRequired,
	setLockDialogOpen    : PropTypes.func.isRequired,
	setHideSelfView      : PropTypes.func.isRequired,
	toggleToolArea       : PropTypes.func.isRequired,
	openUsersTab         : PropTypes.func.isRequired,
	addNotification      : PropTypes.func.isRequired,
	closeNotification    : PropTypes.func.isRequired,
	unread               : PropTypes.number.isRequired,
	canProduceExtraVideo : PropTypes.bool.isRequired,
	canLock              : PropTypes.bool.isRequired,
	canPromote           : PropTypes.bool.isRequired,
	classes              : PropTypes.object.isRequired,
	theme                : PropTypes.object.isRequired,
	intl                 : PropTypes.object,
	locale               : PropTypes.string.isRequired,
	localesList          : PropTypes.array.isRequired,
	localRecordingState  : PropTypes.string,
	recordingInProgress  : PropTypes.bool,
	recordingMimeType    : PropTypes.string,
	producers            : PropTypes.object,
	consumers            : PropTypes.object
};

const makeMapStateToProps = () =>
{
	const hasExtraVideoPermission =
		makePermissionSelector(permissions.EXTRA_VIDEO);

	const hasLockPermission =
		makePermissionSelector(permissions.CHANGE_ROOM_LOCK);

	const hasPromotionPermission =
		makePermissionSelector(permissions.PROMOTE_PEER);

	const mapStateToProps = (state) =>
		({
			room                : state.room,
			isSafari            : state.me.browser.name !== 'safari',
			isMobile            : state.me.browser.platform === 'mobile',
			peersLength         : peersLengthSelector(state),
			lobbyPeers          : lobbyPeersKeySelector(state),
			permanentTopBar     : state.settings.permanentTopBar,
			drawerOverlayed     : state.settings.drawerOverlayed,
			toolAreaOpen        : state.toolarea.toolAreaOpen,
			loggedIn            : state.me.loggedIn,
			loginEnabled        : state.me.loginEnabled,
			localRecordingState : state.me.localRecordingState,
			recordingInProgress	: recordingInProgressSelector(state),
			unread              : state.toolarea.unreadMessages +
				state.toolarea.unreadFiles + raisedHandsSelector(state),
			canProduceExtraVideo : hasExtraVideoPermission(state),
			canLock              : hasLockPermission(state),
			canPromote           : hasPromotionPermission(state),
			locale               : state.intl.locale,
			localesList          : state.intl.list,
			recordingMimeType    : state.settings.recordingMimeType,
			producers            : state.producers,
			consumers            : state.consumers
		});

	return mapStateToProps;
};

const mapDispatchToProps = (dispatch) =>
	({
		setToolbarsVisible : (visible) =>
		{
			dispatch(roomActions.setToolbarsVisible(visible));
		},
		setSettingsOpen : (settingsOpen) =>
		{
			dispatch(roomActions.setSettingsOpen(settingsOpen));
		},
		setExtraVideoOpen : (extraVideoOpen) =>
		{
			dispatch(roomActions.setExtraVideoOpen(extraVideoOpen));
		},
		setHelpOpen : (helpOpen) =>
		{
			dispatch(roomActions.setHelpOpen(helpOpen));
		},
		setAboutOpen : (aboutOpen) =>
		{
			dispatch(roomActions.setAboutOpen(aboutOpen));
		},
		setLeaveOpen : (leaveOpen) =>
		{
			dispatch(roomActions.setLeaveOpen(leaveOpen));
		},
		setLockDialogOpen : (lockDialogOpen) =>
		{
			dispatch(roomActions.setLockDialogOpen(lockDialogOpen));
		},
		setHideSelfView : (hideSelfView) =>
		{
			dispatch(roomActions.setHideSelfView(hideSelfView));
		},
		toggleToolArea : () =>
		{
			dispatch(toolareaActions.toggleToolArea());
		},
		openUsersTab : () =>
		{
			dispatch(toolareaActions.openToolArea());
			dispatch(toolareaActions.setToolTab('users'));
		},
		addNotification : (notification) =>
		{
			dispatch(notificationActions.addNotification(notification));
		},
		closeNotification : (notificationId) =>
		{
			dispatch(notificationActions.closeNotification(notificationId));
		}
	});

export default withRoomContext(connect(
	makeMapStateToProps,
	mapDispatchToProps,
	null,
	{
		areStatesEqual : (next, prev) =>
		{
			return (
				prev.room === next.room &&
				prev.peers === next.peers &&
				prev.lobbyPeers === next.lobbyPeers &&
				prev.settings.permanentTopBar === next.settings.permanentTopBar &&
				prev.settings.drawerOverlayed === next.settings.drawerOverlayed &&
				prev.me.loggedIn === next.me.loggedIn &&
				prev.me.browser === next.me.browser &&
				prev.me.loginEnabled === next.me.loginEnabled &&
				prev.me.picture === next.me.picture &&
				prev.me.roles === next.me.roles &&
				prev.me.localRecordingState === next.me.localRecordingState &&
				prev.toolarea.unreadMessages === next.toolarea.unreadMessages &&
				prev.toolarea.unreadFiles === next.toolarea.unreadFiles &&
				prev.toolarea.toolAreaOpen === next.toolarea.toolAreaOpen &&
				prev.intl.locale === next.intl.locale &&
				prev.intl.localesList === next.intl.localesList &&
				prev.producers === next.producers &&
				prev.consumers === next.consumers
			);
		}
	}
)(withStyles(styles, { withTheme: true })(TopBar)));
