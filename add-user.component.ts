import { NewUserInfoComponent } from '@admin/components/new-user-info/new-user-info.component';
import { ADD_USER_FIELDS } from '@admin/pages/manage-users/manage-users.component';
import { AdminService } from '@admin/services/admin.service';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { IOption } from '@shared/models/icommons.model';
import { IUser, IUserRequest, UserGroups } from '@shared/models/iuser.model';
import { NotificationService } from '@shared/services/notification.service';
import { TranslationService } from 'angular-l10n';

@Component({
  selector: 'miq-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
})
export class AddUserComponent implements AfterViewInit, OnDestroy {
  public usersToAdd: IUser[] = [];
  public userFormGroup: FormGroup; // form group.
  public showUserDetails = false;
  public ADD_USER_FIELDS = ADD_USER_FIELDS;
  @Input()
  public userTypeOptions: IOption[];
  @Input()
  public rolesOptions: IOption[];
  @Input()
  public userStatusOptions: IOption[];
  @Input()
  private currentUserInfo: IUser;
  @Input()
  public userGroupOptions: UserGroups[];
  @Output()
  public userAdded = new EventEmitter<IUser>();
  @Input() userCountryOptions: any[];

  // children components.
  @ViewChild('userInfo')
  private newUserInfoComponent: NewUserInfoComponent;

  constructor(
    private formBuilder: FormBuilder,
    private adminHttpService: AdminService,
    private notificationService: NotificationService,
    public translationService: TranslationService
  ) {}

  public ngAfterViewInit() {
    this.userFormGroup = this.formBuilder.group({
      userInfo: this.newUserInfoComponent.userFormGroup,
    });
  }

  ngOnDestroy() {
    this.newUserInfoComponent = null;
  }

  public showDetails() {
    const userInfo: IUser = {
      username: this.userInfo.get('firstName').value,
      firstName: this.userInfo.get('firstName').value,
      lastName: this.userInfo.get('lastName').value, // TODO: last name does not exists on the model.
      emailAddress: this.userInfo.get('email').value,
      statusId: 1,
      userTypeId: 1,
      roleId: 1,
      groups: [
        { key: 1, value: 'Flyer Availabilities Verification' },
        { key: 5, value: 'EDP Write Access' },
        { key: 4, value: 'Trusted User' },
      ],
    };
    this.usersToAdd = [userInfo];
    this.showUserDetails = true;
  }

  userRequestEvent(event: { userReq: IUserRequest; pendingRequest: boolean }) {
    const { userReq } = event;
    if (userReq) {
      userReq.user.createBy = this.currentUserInfo.emailAddress;
      userReq.user.updateBy = this.currentUserInfo.emailAddress;
      userReq.details.map(m => (m.createBy = this.currentUserInfo.emailAddress));
      this.adminHttpService.postNewUser(userReq).subscribe(
        userId => {
          userReq.user.id = userId;
          this.userAdded.emit(userReq.user);
          this.clearAll();
          this.notificationService.notify({
            message: this.translationService.translate('admin.userCreatedSuccessfully'),
            action: this.translationService.translate('admin.close'),
          });
        },
        () => {
          this.notificationService.notify({
            message: this.translationService.translate('admin.userCreationFailed'),
            action: this.translationService.translate('admin.close'),
          });
        }
      );
    }
  }

  cancelAll(event: string) {
    if (event === 'cancel') {
      this.clearAll();
    }
  }

  private clearAll() {
    this.showUserDetails = false;
    this.usersToAdd = [];
    this.newUserInfoComponent.reset();
  }

  // form group getters.
  public get userInfo(): AbstractControl {
    return this.userFormGroup.get('userInfo');
  }
}
