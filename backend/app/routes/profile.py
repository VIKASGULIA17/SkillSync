
"""
Profile page routing.

GET  /api/profile         — all the info to be showed on profile
POST /api/profile/personalInfo/update — update user info
GET  /api/profile/skilltag  — update skills tag
"""


import logging 
from fastapi import APIRouter ,Depends ,HTTPException,Query
from app.database import get_db,SessionLocal
from sqlalchemy.orm import Session
from app.models import UserProfile 

from app.schema import ProfileInfoChange,ProfileResponse,ProfileSkillsMatrixChange

from .auth import get_current_user

logger =logging.getLogger(__name__)

router = APIRouter(prefix="/api",tags=["UserProfile"])


#GET /api/userprofile

@router.get("/user_profile",response_model=ProfileResponse)
async def fetch_userProfile(currentUser =Depends(get_current_user))-> ProfileResponse:
    """fetch all the info of user for user profile section"""
    try:
        profile=currentUser.profile

        return ProfileResponse(
            user_id=profile.user_id,
            full_name=currentUser.full_name,
            email=currentUser.email,
            target_role=profile.target_role,
            location=profile.location,
            description=profile.description,
            github=profile.github,
            linkedin=profile.linkedin,
            portfolio=profile.portfolio,
            match_score=profile.match_score,
            resume_analysed=profile.resume_analysed,
            skill_matrix=profile.skill_matrix
        )
    except Exception as exc:
        logger.exception("Failed to fetch user profile")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {exc}")
    finally:
        logger.info(f"User profile fetched for user_id: {currentUser.id}")



    
@router.post("/user_profile/personalInfo/update",response_model=bool)
async def changeProfileInfo(body:ProfileInfoChange ,
                            db :Session = Depends(get_db),
                            currentUser = Depends(get_current_user)
                            )-> bool:
    try:
        user_profile= db.query(UserProfile).filter(UserProfile.user_id==currentUser.id).first()
        if user_profile is None:
            raise HTTPException(
                status_code=404,
                detail="Profile not found."
            )
        
        updates = body.model_dump(exclude_unset=True,mode="json")

        for field, value in updates.items():
            if field == "full_name":
                currentUser.full_name = value
            else:
                setattr(user_profile, field, value)
        
        db.commit()

        return True


    except Exception as exc:
        db.rollback()
        logger.exception("Failed to update User Profile")
        raise HTTPException(status_code=500,detail=f"failed to update user Profile :{exc}")
    finally:
        db.close()





@router.post("/user_profile/skill_set/update",response_model=bool)
async def updateSkillSet(body:ProfileSkillsMatrixChange,
                         db:Session = Depends(get_db),
                         current_user= Depends(get_current_user)
                         )-> bool :
    print("updating user profile")

    try:
        user_profile =db.query(UserProfile).filter(UserProfile.user_id==current_user.id).first()

        if(user_profile is None):
            raise HTTPException(status_code=404,detail=f"User doesn't exist with user id :{current_user.id}")
        
        updates=body.model_dump(exclude_unset=True,mode="json")

        user_profile.skill_matrix=updates["skill_matrix"]

        db.commit()

        return True
    
    except Exception as esc:
        logger.exception("Failed to update skill set")
        raise HTTPException(status_code=500,detail=f"error occured while updating skill set ,{esc}")
    
    finally:
        db.close()
    




# user id
# profile pic url 
# target role ( dev / engin)
# location
# summary / description
# github
# linked
# portfolio
# Match score
# resume analysed ( saved resume )
# saved opening 
# skill matrix [ list ] 