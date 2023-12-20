import { Component } from '@angular/core';

import * as _ from 'lodash';

import * as dayjs from 'dayjs';

//import * as path from 'path';
import * as rssFeedParser from 'feedparser-promised';

import { Changelog, Release, parser } from 'keep-a-changelog';
import { SettingsService } from '../../../providers/settings.service';
import { LicenseService } from '../../../providers/license.service';
import { ElectronService } from '../../../core/services';
import Utilities from '../../../helpers/utilities';

type BlogPost = {
  title: string;
  description: string;
  summary: string;
  link: string;
};

@Component({
  selector: 'dburst-whats-new',
  templateUrl: './whats-new.component.html',
})
export class WhatsNewComponent {
  mode = 'news-releases';

  changeLogMarkdown: string;
  changeLog: Changelog;

  visibleRelease: Release;
  visibleReleaseIndex: number;
  visibleReleaseDate: string;

  visibleReleaseBlogPostAnnouncement: BlogPost[];

  blogPosts: BlogPost[];

  visibleBlogPost: BlogPost;
  visibleBlogPostIndex: number;

  constructor(
    protected settingsService: SettingsService,
    protected licenseService: LicenseService,
    protected electronService: ElectronService
  ) {}

  async ngOnInit() {
    await this.licenseService.loadLicenseFileAsync();
    if (this.licenseService.changeLog) {
      this.changeLog = this.licenseService.changeLog;
      this.changeLogMarkdown =
        this.licenseService.licenseDetails.license.changelog;
    } else {
      // if the latest changelog cannot be retrieved from https://store.reportburster.com
      // load the changelog from local CHANGELOG.MD file

      try {
        const localKeepAChangelogContentPath =
          this.electronService.path.resolve(
            Utilities.slash(
              this.electronService.PORTABLE_EXECUTABLE_DIR + '/CHANGELOG.md'
            )
          );

        this.changeLogMarkdown =
          await this.settingsService.loadFileContentAsync(
            localKeepAChangelogContentPath
          );

        this.changeLog = parser(this.changeLogMarkdown);
      } catch {
        //this means that, probably, the file CHANGELOG.md was deleted by the user
      }
    }

    this.blogPosts = await rssFeedParser.parse(
      'https://www.reportburster.com/blog/feed/'
    );

    this.handleVisibleAnnouncement('first');

    this.handleVisibleRelease('first');
  }

  handleVisibleAnnouncement(action: string) {
    if (action == 'first') this.visibleBlogPostIndex = 0;
    else if (action == 'next') this.visibleBlogPostIndex++;
    else this.visibleBlogPostIndex--;

    if (this.blogPosts) {
      this.visibleBlogPost = this.blogPosts[this.visibleBlogPostIndex];
      this.visibleBlogPost.summary = Utilities.getExcerpt(
        this.visibleBlogPost.description,
        this.visibleBlogPost.link
      );
    }
  }

  handleVisibleRelease(action: string) {
    //if the changelog could not be retrieved from any source
    if (!this.changeLog) return;

    if (action == 'first') this.visibleReleaseIndex = 0;
    else if (action == 'next') this.visibleReleaseIndex++;
    else this.visibleReleaseIndex--;

    this.visibleRelease = this.changeLog.releases[this.visibleReleaseIndex];

    this.visibleReleaseDate = dayjs(this.visibleRelease.date).format(
      'DD MMM YYYY'
    );

    let versionNumber = this.visibleRelease.version.raw.trim();

    if (versionNumber.endsWith('.0'))
      versionNumber = versionNumber.replace(/.0/gi, '');

    this.visibleReleaseBlogPostAnnouncement = _.filter(this.blogPosts, (o) => {
      return o.title.includes(versionNumber);
    });
  }

  handleViewMode() {
    this.mode == 'news-releases'
      ? (this.mode = 'changelog')
      : (this.mode = 'news-releases');
  }
}
